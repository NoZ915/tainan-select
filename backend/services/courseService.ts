import { Course } from "../types/courseTypes";
import { PaginationParams } from "../types/courseTypes";
import CourseRepository from "../repositories/courseRepository";

class CourseService {
  async getAllCourses(params: PaginationParams): Promise<{ courses: Course[], total: number }> {
    return await CourseRepository.getAllCourses(params);
  }
}

export default new CourseService();