import { Course, CourseDetailResponse } from "../types/course";
import { PaginationParams } from "../types/course";
import CourseRepository from "../repositories/courseRepository";
import InterestRepository from "../repositories/interestRepository";
import CourseRelatedPostService from "./courseRelatedPostService";

class CourseService {
  async getAllCourses(params: PaginationParams): Promise<{ courses: Course[], total: number }> {
    return await CourseRepository.getAllCourses(params);
  }

  async getCourse(user_id: number|undefined, course_id: number): Promise<CourseDetailResponse | null>{
    const course = await CourseRepository.getCourse(course_id);
    let hasUserAddInterest = false;

    if (!course) return null;
    if(user_id){
      const interest =  await InterestRepository.findInterest(user_id, course_id);
      if(interest !== null) hasUserAddInterest = true;
    };

    const related_posts = await CourseRelatedPostService.getByCourseId(course_id);

    return { course, hasUserAddInterest, related_posts };
  }

  async getAllDepartments(): Promise<string[]>{
    return await CourseRepository.getAllDepartments();
  }

  async getAllAcademies(): Promise<string[]>{
    return await CourseRepository.getAllAcademies();
  }

  async getAllSemesters(): Promise<string[]>{
    return await CourseRepository.getAllSemesters();
  }

  // NOTE: 暫時移除此功能
  async getMostCuriousButUnreviewedCourses(): Promise<Course[]>{
    return await CourseRepository.getMostCuriousButUnreviewedCourses();
  }

  async addViewCount(course_id: number): Promise<void>{
    await CourseRepository.incrementCount(course_id, "view_count");
  }
}

export default new CourseService();
