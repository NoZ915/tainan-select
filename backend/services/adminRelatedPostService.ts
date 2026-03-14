import axios from "axios";
import pLimit from "p-limit";
import { Transaction } from "sequelize";
import db from "../models";
import CourseModel from "../models/Course";
import CourseRelatedPostModel from "../models/CourseRelatedPost";
import RelatedPostImportModel from "../models/RelatedPostImport";
import CourseRelatedPostRepository, {
  CourseRelatedPostUpsertInput,
} from "../repositories/courseRelatedPostRepository";
import RelatedPostImportRepository from "../repositories/relatedPostImportRepository";
import {
  AttachRelatedPostCoursesResult,
  GoogleRelatedPostSyncParams,
  GoogleRelatedPostSyncResult,
  ImportedCourseSummary,
  ManualRelatedPostExistingPost,
  ManualRelatedPostImportItem,
  ManualRelatedPostPreviewResult,
  ManualRelatedPostImportResult,
  RelatedPostOverview,
} from "../types/admin";
import { CourseRelatedPost } from "../types/course";
import {
  matchPostToCourses,
  normalizeRelatedPostText,
  parseDcardPostIdFromUrl,
  RelatedPostCourseRow,
  scoreCourseTextMatch,
} from "../utils/relatedPostMatcher";
import { DcardImportValidationError, parseDcardSourceInput } from "../utils/dcardImportParser";

const MANUAL_SOURCE = "manual_import";
const GOOGLE_SOURCE = "google_search";
const MAX_MANUAL_MATCHES = 15;
const GOOGLE_SEARCH_CONCURRENCY = 3;

type GoogleCustomSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

class AdminRelatedPostService {
  private static readonly RECENT_POSTS_PAGE_SIZE = 10;
  private static readonly RECENT_IMPORTS_PAGE_SIZE = 10;

  private buildImportMatchText(item: ManualRelatedPostImportItem): string {
    return [item.title, item.excerpt, item.content]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0)
      .join(" ");
  }

  private async getAllCourseRows(): Promise<RelatedPostCourseRow[]> {
    return (await CourseModel.findAll({
      attributes: ["id", "course_name", "instructor", "semester"],
      raw: true,
    })) as RelatedPostCourseRow[];
  }

  private async getSyncCandidateCourses(params: GoogleRelatedPostSyncParams): Promise<RelatedPostCourseRow[]> {
    const where: Record<string, unknown> = {};

    if (params.onlyUnreviewed) {
      where.review_count = 0;
    }

    if (params.semester) {
      where.semester = params.semester;
    }

    return (await CourseModel.findAll({
      attributes: ["id", "course_name", "instructor", "semester"],
      where,
      limit: params.limit,
      order: [
        ["view_count", "DESC"],
        ["interests_count", "DESC"],
        ["review_count", "ASC"],
        ["id", "ASC"],
      ],
      raw: true,
    })) as RelatedPostCourseRow[];
  }

  private mapModelToCourseRelatedPost(row: CourseRelatedPostModel): CourseRelatedPost {
    return {
      id: row.id,
      course_id: row.course_id,
      course_name: row.course?.course_name,
      instructor: row.course?.instructor,
      semester: row.course?.semester,
      source: row.source,
      post_id: Number(row.post_id),
      forum_alias: row.forum_alias,
      title: row.title,
      excerpt: row.excerpt,
      preview_title: row.preview_title,
      preview_description: row.preview_description,
      preview_image_url: row.preview_image_url,
      preview_site_name: row.preview_site_name,
      content: row.content,
      comments_json: Array.isArray(row.comments_json) ? (row.comments_json as CourseRelatedPost["comments_json"]) : [],
      post_url: row.post_url,
      created_at_source: row.created_at_source,
      matched_keywords: Array.isArray(row.matched_keywords) ? row.matched_keywords : [],
      score: row.score,
      synced_at: row.synced_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapModelToRelatedPostImport(row: RelatedPostImportModel) {
    return {
      id: row.id,
      source_type: row.source_type,
      raw_payload: row.raw_payload,
      parsed_payload: row.parsed_payload,
      import_result_summary: row.import_result_summary,
      created_by: row.created_by,
      created_by_name: row.creator?.name ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapModelToExistingPreviewPost(row: CourseRelatedPostModel): ManualRelatedPostExistingPost {
    return {
      id: row.id,
      course_id: row.course_id,
      course_name: row.course?.course_name ?? "",
      instructor: row.course?.instructor ?? "",
      semester: row.course?.semester ?? null,
      source: row.source,
      post_url: row.post_url,
      title: row.title,
    };
  }

  async getOverview(recentPostsPage = 1, recentImportsPage = 1): Promise<RelatedPostOverview> {
    const normalizedRecentPostsPage = Math.max(1, recentPostsPage);
    const normalizedRecentImportsPage = Math.max(1, recentImportsPage);

    const [counts, recentPostsResult, recentImportsResult] = await Promise.all([
      CourseRelatedPostRepository.countBySource(),
      CourseRelatedPostRepository.getRecentPage(
        normalizedRecentPostsPage,
        AdminRelatedPostService.RECENT_POSTS_PAGE_SIZE
      ),
      RelatedPostImportRepository.getRecentPage(
        normalizedRecentImportsPage,
        AdminRelatedPostService.RECENT_IMPORTS_PAGE_SIZE
      ),
    ]);

    return {
      counts,
      recentPosts: recentPostsResult.rows.map((row) => this.mapModelToCourseRelatedPost(row)),
      recentImports: recentImportsResult.rows.map((row) => this.mapModelToRelatedPostImport(row)),
      recentPostsPagination: {
        page: normalizedRecentPostsPage,
        pageSize: AdminRelatedPostService.RECENT_POSTS_PAGE_SIZE,
        total: recentPostsResult.count,
        totalPages: Math.max(
          1,
          Math.ceil(recentPostsResult.count / AdminRelatedPostService.RECENT_POSTS_PAGE_SIZE)
        ),
      },
      recentImportsPagination: {
        page: normalizedRecentImportsPage,
        pageSize: AdminRelatedPostService.RECENT_IMPORTS_PAGE_SIZE,
        total: recentImportsResult.count,
        totalPages: Math.max(
          1,
          Math.ceil(recentImportsResult.count / AdminRelatedPostService.RECENT_IMPORTS_PAGE_SIZE)
        ),
      },
    };
  }

  async previewManualPosts(items: ManualRelatedPostImportItem[]): Promise<ManualRelatedPostPreviewResult> {
    const courses = await this.getAllCourseRows();
    let validItemCount = 0;
    let matchedItemCount = 0;

    const previewItems = items.map((item, index) => {
      const title = item.title?.trim();
      const postUrl = item.post_url?.trim();

      if (!title || !postUrl) {
        return {
          index,
          import_item: item,
          post_id: null,
          matches: [],
          existing_posts: [],
          error: "缺少 title 或 post_url",
        };
      }

      const postId = parseDcardPostIdFromUrl(postUrl);
      if (!postId) {
        return {
          index,
          import_item: item,
          post_id: null,
          matches: [],
          existing_posts: [],
          error: "post_url 不是有效的 Dcard 文章網址",
        };
      }

      validItemCount += 1;

      const explicitCourseIds = Array.isArray(item.course_ids)
        ? item.course_ids.map((courseId) => Number(courseId)).filter((courseId) => Number.isInteger(courseId) && courseId > 0)
        : [];
      const matchText = this.buildImportMatchText(item);

      const matches =
        explicitCourseIds.length > 0
          ? explicitCourseIds
              .map((courseId) => courses.find((course) => course.id === courseId))
              .filter((course): course is RelatedPostCourseRow => Boolean(course))
              .map((course) => {
                const scored = scoreCourseTextMatch(
                  normalizeRelatedPostText(matchText),
                  course
                );
                return {
                  course_id: course.id,
                  course_name: course.course_name,
                  instructor: course.instructor,
                  score: Math.max(scored.score, 1),
                  matched_keywords: scored.matched_keywords.length > 0 ? scored.matched_keywords : [String(course.id)],
                };
              })
          : matchPostToCourses(title, [item.excerpt, item.content].filter(Boolean).join(" "), courses, MAX_MANUAL_MATCHES).map((match) => ({
              course_id: match.course.id,
              course_name: match.course.course_name,
              instructor: match.course.instructor,
              score: match.score,
              matched_keywords: match.matched_keywords,
            }));

      if (matches.length > 0) {
        matchedItemCount += 1;
      }

      return {
        index,
        import_item: item,
        post_id: postId,
        matches,
        existing_posts: [],
        error: matches.length === 0 ? "找不到符合的課程" : null,
      };
    });

    const existingRows = await CourseRelatedPostRepository.findExistingByPostIds(
      [...new Set(previewItems.map((item) => item.post_id).filter((postId): postId is number => postId !== null))]
    );
    const existingPostsByPostId = new Map<number, ManualRelatedPostExistingPost[]>();

    for (const row of existingRows) {
      const postId = Number(row.post_id);
      const existingPosts = existingPostsByPostId.get(postId) ?? [];
      existingPosts.push(this.mapModelToExistingPreviewPost(row));
      existingPostsByPostId.set(postId, existingPosts);
    }

    return {
      items: previewItems.map((item) => ({
        ...item,
        existing_posts: item.post_id ? existingPostsByPostId.get(item.post_id) ?? [] : [],
      })),
      validItemCount,
      matchedItemCount,
    };
  }

  async importManualPosts(
    items: ManualRelatedPostImportItem[],
    replaceExisting: boolean,
    transaction?: Transaction
  ): Promise<ManualRelatedPostImportResult> {
    const courses = await this.getAllCourseRows();
    const syncedAt = new Date();
    const rows: CourseRelatedPostUpsertInput[] = [];
    const affectedCourseIds = new Set<number>();
    const importedCoursesById = new Map<number, ImportedCourseSummary>();
    let unmatchedItems = 0;

    for (const item of items) {
      const title = item.title?.trim();
      const postUrl = item.post_url?.trim();

      if (!title || !postUrl) {
        unmatchedItems += 1;
        continue;
      }

      const postId = parseDcardPostIdFromUrl(postUrl);
      if (!postId) {
        unmatchedItems += 1;
        continue;
      }

      const explicitCourseIds = Array.isArray(item.course_ids)
        ? item.course_ids.map((courseId) => Number(courseId)).filter((courseId) => Number.isInteger(courseId) && courseId > 0)
        : [];
      const matchText = this.buildImportMatchText(item);

      const matches =
        explicitCourseIds.length > 0
          ? explicitCourseIds
              .map((courseId) => courses.find((course) => course.id === courseId))
              .filter((course): course is RelatedPostCourseRow => Boolean(course))
              .map((course) => {
                const scored = scoreCourseTextMatch(
                  normalizeRelatedPostText(matchText),
                  course
                );
                return {
                  course,
                  score: Math.max(scored.score, 1),
                  matched_keywords: scored.matched_keywords.length > 0 ? scored.matched_keywords : [String(course.id)],
                };
              })
          : matchPostToCourses(title, [item.excerpt, item.content].filter(Boolean).join(" "), courses, MAX_MANUAL_MATCHES);

      if (matches.length === 0) {
        unmatchedItems += 1;
        continue;
      }

      for (const match of matches) {
        affectedCourseIds.add(match.course.id);
        importedCoursesById.set(match.course.id, {
          course_id: match.course.id,
          course_name: match.course.course_name,
          instructor: match.course.instructor,
          semester: match.course.semester ?? null,
        });
        rows.push({
          course_id: match.course.id,
          source: MANUAL_SOURCE,
          post_id: postId,
          forum_alias: item.forum_alias?.trim() || "nutn",
          title,
          excerpt: item.excerpt?.trim() || null,
          preview_title: item.preview_title?.trim() || title,
          preview_description: item.preview_description?.trim() || item.excerpt?.trim() || null,
          preview_image_url: item.preview_image_url?.trim() || null,
          preview_site_name: item.preview_site_name?.trim() || "Dcard",
          content: item.content?.trim() || null,
          comments_json: Array.isArray(item.comments_json) ? item.comments_json : null,
          post_url: postUrl,
          created_at_source: item.created_at_source ? new Date(item.created_at_source) : syncedAt,
          matched_keywords: match.matched_keywords,
          score: match.score,
          synced_at: syncedAt,
        });
      }
    }

    if (rows.length === 0) {
      throw new Error("沒有可匯入的貼文。請確認 JSON 內容包含 title、post_url，且網址為 Dcard 文章頁。");
    }

    const persist = async (activeTransaction: Transaction) => {
      if (replaceExisting) {
        await CourseRelatedPostRepository.deleteStaleBySourceAndCourseIds(
          MANUAL_SOURCE,
          [...affectedCourseIds],
          activeTransaction
        );
      }
      await CourseRelatedPostRepository.upsertMany(rows, activeTransaction);
    };

    if (transaction) {
      await persist(transaction);
    } else {
      await db.sequelize.transaction(async (newTransaction) => {
        await persist(newTransaction);
      });
    }

    return {
      source: MANUAL_SOURCE,
      importedRows: rows.length,
      matchedCourses: affectedCourseIds.size,
      unmatchedItems,
      replaceExisting,
      imported_courses: [...importedCoursesById.values()].sort((a, b) => a.course_id - b.course_id),
    };
  }

  async importDcardSource(
    input: string,
    replaceExisting: boolean,
    rawInput?: string,
    createdBy?: number | null
  ): Promise<ManualRelatedPostImportResult> {
    const items = parseDcardSourceInput(input);

    if (items.length === 0) {
      throw new DcardImportValidationError("沒有解析出可匯入的 Dcard 文章。請貼上瀏覽器匯出 JSON 或完整文章 HTML。");
    }

    const result = await db.sequelize.transaction(async (transaction) => {
      const importResult = await this.importManualPosts(items, replaceExisting, transaction);

      await RelatedPostImportRepository.create(
        {
          source_type: rawInput && rawInput.trim().startsWith("<") ? "dcard_html" : "dcard_json",
          raw_payload: rawInput?.trim() || input,
          parsed_payload: items,
          import_result_summary: {
            ...importResult,
            parsed_items_count: items.length,
          },
          created_by: createdBy ?? null,
        },
        transaction
      );

      return importResult;
    });

    return result;
  }

  async previewDcardSource(input: string): Promise<ManualRelatedPostPreviewResult> {
    const items = parseDcardSourceInput(input);

    if (items.length === 0) {
      throw new DcardImportValidationError("沒有解析出可預覽的 Dcard 文章。請貼上瀏覽器匯出 JSON 或完整文章 HTML。");
    }

    return await this.previewManualPosts(items);
  }

  async attachRelatedPostToCourses(
    relatedPostId: number,
    courseIds: number[]
  ): Promise<AttachRelatedPostCoursesResult> {
    const normalizedCourseIds = [...new Set(
      courseIds
        .map((courseId) => Number(courseId))
        .filter((courseId) => Number.isInteger(courseId) && courseId > 0)
    )];

    if (normalizedCourseIds.length === 0) {
      throw new Error("course_ids is required");
    }

    const sourceRow = await CourseRelatedPostRepository.getById(relatedPostId);
    if (!sourceRow) {
      throw new Error("Related post not found");
    }

    const courses = await CourseModel.findAll({
      attributes: ["id", "course_name", "instructor", "semester"],
      where: {
        id: normalizedCourseIds,
      },
      raw: true,
    }) as RelatedPostCourseRow[];

    if (courses.length === 0) {
      throw new Error("No valid courses found");
    }

    const existingRows = await CourseRelatedPostRepository.findByPostIdAndCourseIds(
      Number(sourceRow.post_id),
      normalizedCourseIds
    );
    const existingCourseIdSet = new Set(existingRows.map((row) => Number(row.course_id)));

    const rowsToCreate: CourseRelatedPostUpsertInput[] = [];
    const importedCourses: ImportedCourseSummary[] = [];
    const attachedCourseIds: number[] = [];

    for (const course of courses) {
      if (existingCourseIdSet.has(course.id)) {
        continue;
      }

      attachedCourseIds.push(course.id);
      importedCourses.push({
        course_id: course.id,
        course_name: course.course_name,
        instructor: course.instructor,
        semester: course.semester ?? null,
      });

      const nextMatchedKeywords = Array.from(
        new Set([...(Array.isArray(sourceRow.matched_keywords) ? sourceRow.matched_keywords : []), "manual_course_bind"])
      );

      rowsToCreate.push({
        course_id: course.id,
        source: sourceRow.source,
        post_id: Number(sourceRow.post_id),
        forum_alias: sourceRow.forum_alias,
        title: sourceRow.title,
        excerpt: sourceRow.excerpt,
        preview_title: sourceRow.preview_title,
        preview_description: sourceRow.preview_description,
        preview_image_url: sourceRow.preview_image_url,
        preview_site_name: sourceRow.preview_site_name,
        content: sourceRow.content,
        comments_json: Array.isArray(sourceRow.comments_json) ? sourceRow.comments_json : null,
        post_url: sourceRow.post_url,
        created_at_source: sourceRow.created_at_source,
        matched_keywords: nextMatchedKeywords,
        score: Math.max(Number(sourceRow.score) || 0, 1),
        synced_at: new Date(),
      });
    }

    if (rowsToCreate.length > 0) {
      await CourseRelatedPostRepository.upsertMany(rowsToCreate);
    }

    const skippedCourseIds = normalizedCourseIds.filter((courseId) => !attachedCourseIds.includes(courseId));

    return {
      related_post_id: relatedPostId,
      post_id: Number(sourceRow.post_id),
      requestedCourses: normalizedCourseIds.length,
      attachedCourses: attachedCourseIds.length,
      skippedCourses: skippedCourseIds.length,
      attached_course_ids: attachedCourseIds,
      skipped_course_ids: skippedCourseIds,
      imported_courses: importedCourses.sort((a, b) => a.course_id - b.course_id),
    };
  }

  async syncGoogleResults(params: GoogleRelatedPostSyncParams): Promise<GoogleRelatedPostSyncResult> {
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleCx = process.env.GOOGLE_SEARCH_CX;

    if (!googleApiKey || !googleCx) {
      throw new Error("GOOGLE_SEARCH_API_KEY 或 GOOGLE_SEARCH_CX 未設定");
    }

    const courses = await this.getSyncCandidateCourses(params);
    const limit = pLimit(GOOGLE_SEARCH_CONCURRENCY);
    const syncedAt = new Date();
    const rows: CourseRelatedPostUpsertInput[] = [];
    const affectedCourseIds = new Set<number>();
    let noResultCourses = 0;

    const perCourseRows = await Promise.all(
      courses.map((course) =>
        limit(async () => {
          const query = `site:dcard.tw/f/nutn "${course.course_name}" "${course.instructor}"`;
          const response = await axios.get<{ items?: GoogleCustomSearchItem[] }>(
            "https://customsearch.googleapis.com/customsearch/v1",
            {
              params: {
                key: googleApiKey,
                cx: googleCx,
                q: query,
                num: Math.min(Math.max(params.maxResultsPerCourse, 1), 10),
              },
              timeout: 15000,
            }
          );

          const items = response.data.items ?? [];
          if (items.length === 0) {
            noResultCourses += 1;
            return [];
          }

          const matchedRows = items
            .map((item): CourseRelatedPostUpsertInput | null => {
              const title = item.title?.trim() || "";
              const postUrl = item.link?.trim() || "";
              const postId = parseDcardPostIdFromUrl(postUrl);
              if (!title || !postUrl || !postId) return null;

              const scored = scoreCourseTextMatch(
                normalizeRelatedPostText(`${title} ${item.snippet ?? ""}`),
                course
              );
              if (scored.matched_keywords.length === 0) return null;

              return {
                course_id: course.id,
                source: GOOGLE_SOURCE,
                post_id: postId,
                forum_alias: "nutn",
                title,
                excerpt: item.snippet?.trim() || null,
                preview_title: title,
                preview_description: item.snippet?.trim() || null,
                preview_image_url: null,
                preview_site_name: "Google 搜尋 / Dcard",
                content: null,
                comments_json: null,
                post_url: postUrl,
                created_at_source: syncedAt,
                matched_keywords: scored.matched_keywords,
                score: Math.max(scored.score, 1),
                synced_at: syncedAt,
              };
            })
            .filter((item): item is CourseRelatedPostUpsertInput => item !== null);

          if (matchedRows.length === 0) {
            noResultCourses += 1;
            return [];
          }

          affectedCourseIds.add(course.id);
          return matchedRows;
        })
      )
    );

    rows.push(...perCourseRows.flat());

    if (rows.length === 0) {
      throw new Error("Google 搜尋沒有找到可寫入的相關貼文");
    }

    await db.sequelize.transaction(async (transaction) => {
      if (params.replaceExisting) {
        await CourseRelatedPostRepository.deleteStaleBySourceAndCourseIds(
          GOOGLE_SOURCE,
          courses.map((course) => course.id),
          transaction
        );
      }
      await CourseRelatedPostRepository.upsertMany(rows, transaction);
    });

    return {
      source: GOOGLE_SOURCE,
      scannedCourses: courses.length,
      searchedCourses: courses.length,
      matchedCourses: affectedCourseIds.size,
      insertedRows: rows.length,
      noResultCourses,
      replaceExisting: params.replaceExisting,
    };
  }

  async deleteRelatedPost(id: number): Promise<void> {
    const deleted = await CourseRelatedPostRepository.deleteById(id);
    if (deleted === 0) {
      throw new Error("找不到要刪除的相關貼文");
    }
  }

  async deleteRelatedPostImport(id: number): Promise<void> {
    const deleted = await RelatedPostImportRepository.deleteById(id);
    if (deleted === 0) {
      throw new Error("找不到要刪除的匯入紀錄");
    }
  }
}

export default new AdminRelatedPostService();
