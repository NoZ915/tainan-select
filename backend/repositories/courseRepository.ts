import { Op, Sequelize } from "sequelize";
import CourseModel from "../models/Course";
import { Course } from "../types/course";
import { PaginationParams } from "../types/course";

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
    const categoryConditions: any[] = [];
    if (search && search.category === "general") {
      categoryConditions.push({ department: { [Op.like]: "%通識%" } });
    } else if (search && search.category === "university") {
      categoryConditions.push({
        [Op.and]: [
          { department: { [Op.notLike]: "%碩士%" } },
          { department: { [Op.notLike]: "%通識%" } },
        ]
      });
    } else if (search && search.category === "graduate") {
      categoryConditions.push({ department: { [Op.like]: "%碩士%" } });
    } else if (search && search.category === "teacher") {
      categoryConditions.push({ department: { [Op.like]: "%師%" } });
    }
    if (search && search.department) {
      categoryConditions.push({ department: search.department });
    }
    if (categoryConditions.length > 0) {
      whereCondition[Op.and] = categoryConditions;
    }

    if (search && search.academy) whereCondition.academy = search.academy;
    if (search && search.courseType) whereCondition.course_type = search.courseType;

    const [courses, total] = await Promise.all([
      CourseModel.findAll({ where: whereCondition, limit, offset }),
      CourseModel.count({ where: whereCondition }),
    ]);
    return { courses, total };
  }

  async getCourse(course_id: number): Promise<Course | null> {
    if (isNaN(course_id)) {
      throw new Error("Invalid course ID");
    }
    return await CourseModel.findByPk(course_id);
  }

  async getAllDepartments(): Promise<string[]> {
    const departments = await CourseModel.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("department")), "department"]],
      raw: true
    });
    const departmentList = departments.map((item: { department: string }) => {
      return item.department
    })
    return departmentList;
  }

  async getAllAcademies(): Promise<string[]> {
    const academies = await CourseModel.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("academy")), "academy"]],
      raw: true
    });
    const academyList = academies
      .map((item: { academy?: string }) => item.academy)
      .filter((academy): academy is string => academy != null && academy.trim() !== '');
    return academyList;
  }
}

export default new CourseRepository();
