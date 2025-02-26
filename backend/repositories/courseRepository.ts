import CourseModel, { Course } from "../models/Course";

class CourseRepository {
  async getAllCourses(): Promise<Course[]> {
    return await CourseModel.findAll();
  }
}

export default new CourseRepository();