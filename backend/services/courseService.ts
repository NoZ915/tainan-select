import { Course } from "../types/course";
import { PaginationParams } from "../types/course";
import CourseRepository from "../repositories/courseRepository";

class CourseService {
  async getAllCourses(params: PaginationParams): Promise<{ courses: Course[], total: number }> {
    return await CourseRepository.getAllCourses(params);
  }

  async getCourse(course_id: number): Promise<{course: Course} | null>{
    const course = await CourseRepository.getCourse(course_id);
    if (!course) return null;
    return { course };
  }

  async getAllDepartments(): Promise<string[]>{
    return await CourseRepository.getAllDepartments();
  }

  async getAllAcademies(): Promise<string[]>{
    return await CourseRepository.getAllAcademies();
  }

  async getMostCuriousButUnreviewedCourses(): Promise<Course[]>{
    return await CourseRepository.getMostCuriousButUnreviewedCourses();
  }

  async addViewCount(course_id: number): Promise<void>{
    await CourseRepository.incrementCount(course_id, "view_count");
  }
}

export default new CourseService();