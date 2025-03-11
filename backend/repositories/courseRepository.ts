import { Op } from "sequelize";
import CourseModel from "../models/Course";
import { Course } from "../types/courseTypes";
import { PaginationParams } from "../types/courseTypes";

class CourseRepository {
  async getAllCourses({ limit, offset, search }: PaginationParams): Promise<{ courses: Course[], total: number }> {
    const whereCondition = search
      ? {
        [Op.or]: [
          { course_name: { [Op.like]: `%${search}%` } }, // 課程名稱包含搜尋字詞
          { instructor: { [Op.like]: `%${search}%` } } // 教師名稱包含搜尋字詞
        ],
      }
      : {};

    const [courses, total] = await Promise.all([
      CourseModel.findAll({ limit, offset }),
      CourseModel.count()
    ])
    return { courses, total };
  }
}

export default new CourseRepository();