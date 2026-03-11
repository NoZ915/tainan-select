import CourseRelatedPostRepository from "../repositories/courseRelatedPostRepository";
import { CourseRelatedPost } from "../types/course";

class CourseRelatedPostService {
  async getByCourseId(course_id: number): Promise<CourseRelatedPost[]> {
    const rows = await CourseRelatedPostRepository.getByCourseId(course_id);
    return rows.map((row) => ({
      id: row.id,
      course_id: row.course_id,
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
    }));
  }
}

export default new CourseRelatedPostService();
