import { Op } from "sequelize";
import CourseModel from "../models/Course";
import { Course } from "../types/courseTypes";
import { PaginationParams } from "../types/courseTypes";

class CourseRepository {
  async getAllCourses({
    limit,
    offset,
    search,
  }: PaginationParams): Promise<{ courses: Course[]; total: number }> {
    const whereCondition: any = {};

    if (search && search.search) {
      whereCondition[Op.or] = [
        { course_name: { [Op.like]: `%${search.search.toLowerCase()}%` } },
        { instructor: { [Op.like]: `%${search.search.toLowerCase()}%` } },
      ];
    }

    // category(tab選項)filter與department有關
    const categoryCondition: any = {};
    if (search && search.category === "general") {
      categoryCondition.department = { [Op.like]: "%通識%" };
    } else if (search && search.category === "university") {
      categoryCondition.department = { [Op.notLike]: "%碩士%" };
    } else if (search && search.category === "graduate") {
      categoryCondition.department = { [Op.like]: "%碩士%" };
    } else if (search && search.category === "teacher") {
      categoryCondition.department = { [Op.like]: "%師%" };
    }
    if (search && search.department) {
      categoryCondition.department = search.department;
    }
    Object.assign(whereCondition, categoryCondition);

    if (search && search.academy) whereCondition.academy = search.academy;
    if (search && search.courseType) whereCondition.course_type = search.courseType;

    const [courses, total] = await Promise.all([
      CourseModel.findAll({ where: whereCondition, limit, offset }),
      CourseModel.count({ where: whereCondition }),
    ]);
    return { courses, total };
  }
}

export default new CourseRepository();
