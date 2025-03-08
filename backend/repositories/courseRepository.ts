import CourseModel, { Course } from "../models/Course";
import { PaginationParams } from "../types/courseTypes";

class CourseRepository {
  async getAllCourses({ limit, offset }: PaginationParams): Promise<{ courses: Course[], total: number }> {
    const [ courses, total ] = await Promise.all([
      CourseModel.findAll({ limit, offset }),
      CourseModel.count()
    ])
    return { courses, total };
  }
}

export default new CourseRepository();