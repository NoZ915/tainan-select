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
  grade: string;
  courseType: string;
}