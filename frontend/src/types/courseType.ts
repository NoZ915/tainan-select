export interface Course {
  id: number;
  course_name: string;
  department: string;
  academy?: string;
  instructor: string;
  instructor_url?: string;
  course_room?: string;
  course_time?: string;
  course_url?: string;
  credit_hours: number;
  semester: string;
  created_at: Date;
  updated_at: Date;
  course_type: string;
  review_count: number;
  interests_count: number;
  view_count: number;
  dcard_related_post_count?: number;
}

export interface CourseRelatedPost {
  id: number;
  course_id?: number;
  course_name?: string;
  instructor?: string;
  semester?: string;
  source: string;
  post_id: number;
  forum_alias: string;
  title: string;
  excerpt: string | null;
  preview_title?: string | null;
  preview_description?: string | null;
  preview_image_url?: string | null;
  preview_site_name?: string | null;
  content?: string | null;
  comments_json?: RelatedPostComment[];
  post_url: string;
  created_at_source: Date;
  matched_keywords: string[];
  score: number;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RelatedPostComment {
  author?: string | null;
  text: string;
  created_at?: string | null;
  url?: string | null;
  like_count?: number | null;
}

export interface CourseDetailResponse {
  course: Course;
  hasUserAddInterest: boolean;
  related_posts: CourseRelatedPost[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface CourseResponse {
  courses: Course[];
  pagination: Pagination;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface SearchParams {
  page: number;
  limit: number;
  search: string;
  category: string;
  academy: string;
  department: string;
  courseType: string;
  weekdays: string[];
  periods: string[];
  semesters: string[];
  sortBy?: string;
}
