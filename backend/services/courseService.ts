import { Course } from "../types/course";
import { PaginationParams } from "../types/course";
import CourseRepository from "../repositories/courseRepository";

class CourseService {
  async getAllCourses(params: PaginationParams): Promise<{ courses: Course[], total: number }> {
    return await CourseRepository.getAllCourses(params);
  }

  async getCourse(course_id: number, user_id: number | undefined): Promise<{course: Course | null, hasUserReviewedCourse: boolean} | null>{
    let hasUserReviewedCourse = false;
    const course = await CourseRepository.getCourse(course_id);
    if(user_id !== undefined){
      hasUserReviewedCourse = await CourseRepository.hasUserReviewedCourse(course_id, user_id);
    }
    return {course, hasUserReviewedCourse}
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
}

export default new CourseService();