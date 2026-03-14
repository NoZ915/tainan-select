import { Op, Transaction } from "sequelize";
import CourseRelatedPostModel from "../models/CourseRelatedPost";
import CourseModel from "../models/Course";

export type CourseRelatedPostUpsertInput = {
  course_id: number;
  source: string;
  post_id: number;
  forum_alias: string;
  title: string;
  excerpt: string | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image_url: string | null;
  preview_site_name: string | null;
  content: string | null;
  comments_json: unknown[] | null;
  post_url: string;
  created_at_source: Date;
  matched_keywords: string[];
  score: number;
  synced_at: Date;
};

class CourseRelatedPostRepository {
  async getByCourseId(course_id: number, limit = 8): Promise<CourseRelatedPostModel[]> {
    return await CourseRelatedPostModel.findAll({
      where: { course_id },
      order: [
        ["score", "DESC"],
        ["created_at_source", "DESC"],
        ["id", "DESC"],
      ],
      limit,
    });
  }

  async replaceForSource(
    source: string,
    rows: CourseRelatedPostUpsertInput[],
    transaction?: Transaction
  ): Promise<void> {
    await CourseRelatedPostModel.destroy({
      where: { source },
      transaction,
    });

    if (rows.length === 0) return;

    await CourseRelatedPostModel.bulkCreate(rows, { transaction });
  }

  async upsertMany(rows: CourseRelatedPostUpsertInput[], transaction?: Transaction): Promise<void> {
    if (rows.length === 0) return;

    await CourseRelatedPostModel.bulkCreate(rows, {
      transaction,
      updateOnDuplicate: [
        "forum_alias",
        "title",
        "excerpt",
        "preview_title",
        "preview_description",
        "preview_image_url",
        "preview_site_name",
        "content",
        "comments_json",
        "post_url",
        "created_at_source",
        "matched_keywords",
        "score",
        "synced_at",
        "updated_at",
      ],
    });
  }

  async deleteStaleBySourceAndCourseIds(
    source: string,
    courseIds: number[],
    transaction?: Transaction
  ): Promise<void> {
    if (courseIds.length === 0) return;

    await CourseRelatedPostModel.destroy({
      where: {
        source,
        course_id: { [Op.in]: courseIds },
      },
      transaction,
    });
  }

  async countBySource(): Promise<Array<{ source: string; count: number }>> {
    const rows = (await CourseRelatedPostModel.findAll({
      attributes: [
        "source",
        [CourseRelatedPostModel.sequelize!.fn("COUNT", CourseRelatedPostModel.sequelize!.col("id")), "count"],
      ],
      group: ["source"],
      raw: true,
    })) as unknown as Array<{ source: string; count: number | string }>;

    return rows.map((row) => ({
      source: String(row.source),
      count: Number(row.count),
    }));
  }

  async getRecent(limit = 20): Promise<CourseRelatedPostModel[]> {
    return await CourseRelatedPostModel.findAll({
      include: [
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "instructor", "semester"],
        },
      ],
      order: [
        ["synced_at", "DESC"],
        ["id", "DESC"],
      ],
      limit,
    });
  }

  async getRecentPage(page: number, pageSize: number): Promise<{ rows: CourseRelatedPostModel[]; count: number }> {
    return await CourseRelatedPostModel.findAndCountAll({
      include: [
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "instructor", "semester"],
        },
      ],
      order: [
        ["synced_at", "DESC"],
        ["id", "DESC"],
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  }

  async findExistingByPostIds(postIds: number[]): Promise<CourseRelatedPostModel[]> {
    if (postIds.length === 0) return [];

    return await CourseRelatedPostModel.findAll({
      where: {
        post_id: {
          [Op.in]: postIds,
        },
      },
      include: [
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "instructor", "semester"],
        },
      ],
      order: [
        ["post_id", "ASC"],
        ["id", "ASC"],
      ],
    });
  }

  async getById(id: number): Promise<CourseRelatedPostModel | null> {
    return await CourseRelatedPostModel.findByPk(id, {
      include: [
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "instructor", "semester"],
        },
      ],
    });
  }

  async findByPostIdAndCourseIds(post_id: number, courseIds: number[]): Promise<CourseRelatedPostModel[]> {
    if (courseIds.length === 0) return [];

    return await CourseRelatedPostModel.findAll({
      where: {
        post_id,
        course_id: {
          [Op.in]: courseIds,
        },
      },
      include: [
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "instructor", "semester"],
        },
      ],
      order: [["id", "ASC"]],
    });
  }

  async deleteById(id: number): Promise<number> {
    return await CourseRelatedPostModel.destroy({
      where: { id },
    });
  }
}

export default new CourseRelatedPostRepository();
