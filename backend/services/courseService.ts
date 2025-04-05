import { Course } from "../types/course";
import { PaginationParams } from "../types/course";
import CourseRepository from "../repositories/courseRepository";

class CourseService {
  async getAllCourses(params: PaginationParams): Promise<{ courses: Course[], total: number }> {
    return await CourseRepository.getAllCourses(params);
  }

  async getCourse(course_id: number): Promise<Course | null>{
    return await CourseRepository.getCourse(course_id);
  }

  async getAllDepartments(): Promise<string[]>{
    return await CourseRepository.getAllDepartments();
  }

  async getAllAcademies(): Promise<string[]>{
    return await CourseRepository.getAllAcademies();
  }
}

export default new CourseService();