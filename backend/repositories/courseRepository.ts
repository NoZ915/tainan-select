import { Op } from "sequelize";
import CourseModel from "../models/Course";
import { Course } from "../types/courseTypes";
import { PaginationParams } from "../types/courseTypes";

class CourseRepository {
  async getAllCourses({ limit, offset, search }: PaginationParams): Promise<{ courses: Course[], total: number }> {
    const whereCondition = search
      ? {
        [Op.or]: [
          { course_name: { [Op.like]: `%${search.toLowerCase()}%` } },
          { instructor: { [Op.like]: `%${search.toLowerCase()}%` } }
        ],
      }
      : {};

    const [courses, total] = await Promise.all([
      CourseModel.findAll({ where: whereCondition, limit, offset }),
      CourseModel.count({ where: whereCondition })
    ])
    return { courses, total };
  }
}

export default new CourseRepository();