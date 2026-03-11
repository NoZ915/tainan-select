import { RelatedPostComment } from "./course";
import { CourseRelatedPost } from "./course";

export type RelatedPostOverview = {
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
};

export type RelatedPostImportRecord = {
  id: number;
  source_type: string;
  raw_payload: string;
  parsed_payload: unknown[] | Record<string, unknown> | null;
  import_result_summary: Record<string, unknown> | null;
  created_by: number | null;
  created_by_name?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ImportedCourseSummary = {
  course_id: number;
  course_name: string;
  instructor: string;
  semester: string | null;
};

export type ManualRelatedPostImportItem = {
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
};

export type ManualRelatedPostImportResult = {
  source: string;
  importedRows: number;
  matchedCourses: number;
  unmatchedItems: number;
  replaceExisting: boolean;
  imported_courses: ImportedCourseSummary[];
};

export type ManualRelatedPostPreviewMatch = {
  course_id: number;
  course_name: string;
  instructor: string;
  score: number;
  matched_keywords: string[];
};

export type ManualRelatedPostExistingPost = {
  id: number;
  course_id: number;
  course_name: string;
  instructor: string;
  semester: string | null;
  source: string;
  post_url: string;
  title: string;
};

export type ManualRelatedPostPreviewItem = {
  index: number;
  import_item: ManualRelatedPostImportItem;
  post_id: number | null;
  matches: ManualRelatedPostPreviewMatch[];
  existing_posts: ManualRelatedPostExistingPost[];
  error: string | null;
};

export type ManualRelatedPostPreviewResult = {
  items: ManualRelatedPostPreviewItem[];
  validItemCount: number;
  matchedItemCount: number;
};

export type GoogleRelatedPostSyncParams = {
  limit: number;
  onlyUnreviewed: boolean;
  semester?: string;
  replaceExisting: boolean;
  maxResultsPerCourse: number;
};

export type GoogleRelatedPostSyncResult = {
  source: string;
  scannedCourses: number;
  searchedCourses: number;
  matchedCourses: number;
  insertedRows: number;
  noResultCourses: number;
  replaceExisting: boolean;
};
