import { load } from "cheerio";
import { ManualRelatedPostImportItem } from "../types/admin";

type DcardJsonLdComment = {
  text?: string;
  datePublished?: string;
  url?: string;
  interactionStatistic?: {
    userInteractionCount?: number;
  };
  author?: {
    name?: string;
  };
};

type DcardJsonLdPosting = {
  "@type"?: string;
  headline?: string;
  text?: string;
  url?: string;
  datePublished?: string;
  comment?: DcardJsonLdComment[];
};

type DcardNextData = {
  query?: {
    forumAlias?: string;
    postId?: string;
  };
  props?: {
    initialState?: {
      post?: {
        data?: Record<
          string,
          {
            title?: string;
            excerpt?: string;
            content?: string;
            createdAt?: string;
            forumAlias?: string;
          }
        >;
      };
    };
  };
};

const cleanText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
};

const cleanLongText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\r\n/g, "\n").trim();
  return cleaned.length > 0 ? cleaned : null;
};

const normalizeComments = (value: unknown): ManualRelatedPostImportItem["comments_json"] => {
  if (!Array.isArray(value)) return null;

  const comments = value
    .map((comment) => {
      if (!comment || typeof comment !== "object") return null;
      const row = comment as Record<string, unknown>;
      const text = cleanLongText(row.text);
      if (!text) return null;

      return {
        author: cleanText(row.author),
        text,
        created_at: cleanText(row.created_at),
        url: cleanText(row.url),
        like_count:
          typeof row.like_count === "number" && Number.isFinite(row.like_count)
            ? row.like_count
            : null,
      };
    })
    .filter((comment): comment is NonNullable<typeof comment> => comment !== null);

  return comments.length > 0 ? comments : null;
};

const normalizeItem = (item: Record<string, unknown>): ManualRelatedPostImportItem | null => {
  const title = cleanText(item.title) ?? cleanText(item.preview_title);
  const postUrl = cleanText(item.post_url) ?? cleanText(item.url);

  if (!title || !postUrl) return null;

  const courseIds = Array.isArray(item.course_ids)
    ? item.course_ids
        .map((courseId) => Number(courseId))
        .filter((courseId) => Number.isInteger(courseId) && courseId > 0)
    : undefined;

  return {
    title,
    post_url: postUrl,
    excerpt: cleanText(item.excerpt) ?? cleanText(item.preview_description),
    created_at_source: cleanText(item.created_at_source) ?? cleanText(item.createdAt),
    forum_alias: cleanText(item.forum_alias) ?? cleanText(item.forumAlias),
    course_ids: courseIds && courseIds.length > 0 ? courseIds : undefined,
    preview_title: cleanText(item.preview_title) ?? title,
    preview_description: cleanText(item.preview_description) ?? cleanText(item.excerpt),
    preview_image_url: cleanText(item.preview_image_url),
    preview_site_name: cleanText(item.preview_site_name),
    content: cleanLongText(item.content),
    comments_json: normalizeComments(item.comments_json ?? item.comments),
  };
};

const parseJsonInput = (input: string): ManualRelatedPostImportItem[] => {
  const parsed = JSON.parse(input) as unknown;
  const items = Array.isArray(parsed) ? parsed : [parsed];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      return normalizeItem(item as Record<string, unknown>);
    })
    .filter((item): item is ManualRelatedPostImportItem => item !== null);
};

const parseHtmlInput = (input: string): ManualRelatedPostImportItem[] => {
  const $ = load(input);
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() ?? null;
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? null;
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() ?? null;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() ?? null;
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim() ?? null;

  let title = ogTitle ?? $("title").text().trim() ?? null;
  if (title) {
    title = title
      .replace(/\s+-\s+臺南大學板\s+\|\s+Dcard$/u, "")
      .replace(/\s+\|\s+Dcard$/u, "")
      .trim();
  }

  let forumAlias =
    canonical?.match(/\/f\/([^/]+)\/p\//)?.[1]?.trim() ??
    null;

  let createdAt: string | null = null;
  let content: string | null = null;
  let excerpt: string | null = ogDescription;
  let comments: ManualRelatedPostImportItem["comments_json"] = null;

  const nextDataRaw = $("#__NEXT_DATA__").text().trim();
  if (nextDataRaw) {
    try {
      const nextData = JSON.parse(nextDataRaw) as DcardNextData;
      const postId = nextData.query?.postId;
      const postData = postId
        ? nextData.props?.initialState?.post?.data?.[postId]
        : undefined;

      title = cleanText(postData?.title) ?? title;
      excerpt = cleanText(postData?.excerpt) ?? excerpt;
      content = cleanLongText(postData?.content) ?? content;
      createdAt = cleanText(postData?.createdAt) ?? createdAt;
      forumAlias = cleanText(postData?.forumAlias) ?? forumAlias;
    } catch {
      // ignore invalid __NEXT_DATA__
    }
  }

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as DcardJsonLdPosting | DcardJsonLdPosting[];
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const posting = items.find((item) => item?.["@type"] === "SocialMediaPosting");
      if (!posting) return;

      title = cleanText(posting.headline) ?? title;
      content = cleanLongText(posting.text) ?? content;
      createdAt = cleanText(posting.datePublished) ?? createdAt;
      const parsedComments = Array.isArray(posting.comment)
        ? posting.comment
            .map((comment) => {
              const text = cleanLongText(comment.text);
              if (!text) return null;

              return {
                author: cleanText(comment.author?.name),
                text,
                created_at: cleanText(comment.datePublished),
                url: cleanText(comment.url),
                like_count:
                  typeof comment.interactionStatistic?.userInteractionCount === "number"
                    ? comment.interactionStatistic.userInteractionCount
                    : null,
              };
            })
            .filter((comment): comment is NonNullable<typeof comment> => comment !== null)
        : [];

      if (parsedComments.length > 0) {
        comments = parsedComments;
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });

  const normalized = normalizeItem({
    title,
    post_url: canonical,
    excerpt,
    created_at_source: createdAt,
    forum_alias: forumAlias,
    preview_title: ogTitle ?? title,
    preview_description: ogDescription ?? excerpt,
    preview_image_url: ogImage,
    preview_site_name: ogSiteName,
    content,
    comments_json: comments,
  });

  return normalized ? [normalized] : [];
};

export const parseDcardSourceInput = (input: string): ManualRelatedPostImportItem[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJsonInput(trimmed);
  }

  if (trimmed.includes("<html") || trimmed.includes("<meta") || trimmed.includes("__NEXT_DATA__")) {
    return parseHtmlInput(trimmed);
  }

  return [];
};
