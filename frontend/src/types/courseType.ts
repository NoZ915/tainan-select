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
  request_count: number;
  view_count: number;
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


export interface CourseSearchParams {
  search: string;
  category: string;
  academy: string;
  department: string;
  courseType: string;
}
export interface PaginationParams {
  page: number;
  limit: number;
}
export type CombinedSearchParams = CourseSearchParams & PaginationParams;