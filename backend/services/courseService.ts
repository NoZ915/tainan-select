import { Course } from "../models/Course";
import CourseRepository from "../repositories/courseRepository";

class CourseService {
  async getAllCourses(): Promise<Course[]> {
    return await CourseRepository.getAllCourses();
  }
}

export default new CourseService();