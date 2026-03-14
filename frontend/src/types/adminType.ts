import { RelatedPostComment } from './courseType'
import { CourseRelatedPost } from './courseType'

export interface AdminStatusResponse {
  isAdmin: boolean;
}

export interface RelatedPostOverviewResponse {
  counts: Array<{ source: string; count: number }>;
  recentPosts: CourseRelatedPost[];
  recentImports: RelatedPostImportRecord[];
  recentPostsPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  recentImportsPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface RelatedPostImportRecord {
  id: number;
  source_type: string;
  raw_payload: string;
  parsed_payload: unknown[] | Record<string, unknown> | null;
  import_result_summary: Record<string, unknown> | null;
  created_by: number | null;
  created_by_name?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ImportedCourseSummary {
  course_id: number;
  course_name: string;
  instructor: string;
  semester: string | null;
}

export interface ManualImportPayloadItem {
  title: string;
  post_url: string;
  excerpt?: string | null;
  created_at_source?: string | null;
  forum_alias?: string | null;
  course_ids?: number[];
  preview_title?: string | null;
  preview_description?: string | null;
  preview_image_url?: string | null;
  preview_site_name?: string | null;
  content?: string | null;
  comments_json?: RelatedPostComment[] | null;
}

export interface ManualImportResponse {
  source: string;
  importedRows: number;
  matchedCourses: number;
  unmatchedItems: number;
  replaceExisting: boolean;
  imported_courses: ImportedCourseSummary[];
}

export interface DcardSourceImportPayload {
  input: string;
  rawInput?: string;
  replaceExisting: boolean;
}

export interface ManualImportPreviewMatch {
  course_id: number;
  course_name: string;
  instructor: string;
  score: number;
  matched_keywords: string[];
}

export interface ManualImportExistingPost {
  id: number;
  course_id: number;
  course_name: string;
  instructor: string;
  semester: string | null;
  source: string;
  post_url: string;
  title: string;
}

export interface ManualImportPreviewItem {
  index: number;
  import_item: ManualImportPayloadItem;
  post_id: number | null;
  matches: ManualImportPreviewMatch[];
  existing_posts: ManualImportExistingPost[];
  error: string | null;
}

export interface ManualImportPreviewResponse {
  items: ManualImportPreviewItem[];
  validItemCount: number;
  matchedItemCount: number;
}

export interface GoogleSyncPayload {
  limit: number;
  maxResultsPerCourse: number;
  onlyUnreviewed: boolean;
  semester?: string;
  replaceExisting: boolean;
}

export interface GoogleSyncResponse {
  source: string;
  scannedCourses: number;
  searchedCourses: number;
  matchedCourses: number;
  insertedRows: number;
  noResultCourses: number;
  replaceExisting: boolean;
}

export interface AttachRelatedPostCoursesPayload {
  course_ids: number[];
}

export interface AttachRelatedPostCoursesResponse {
  related_post_id: number;
  post_id: number;
  requestedCourses: number;
  attachedCourses: number;
  skippedCourses: number;
  attached_course_ids: number[];
  skipped_course_ids: number[];
  imported_courses: ImportedCourseSummary[];
}
