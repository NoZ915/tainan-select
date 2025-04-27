import { Op, Transaction } from "sequelize";
import CourseModel from "../models/Course";
import { Course } from "../types/course";
import { PaginationParams } from "../types/course";
import db from "../models";

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
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("department")), "department"]],
      raw: true
    });
    const departmentList = departments.map((item: { department: string }) => {
      return item.department
    })
    return departmentList;
  }

  async getAllAcademies(): Promise<string[]> {
    const academies = await CourseModel.findAll({
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("academy")), "academy"]],
      raw: true
    });
    const academyList = academies
      .map((item: { academy?: string }) => item.academy)
      .filter((academy): academy is string => academy != null && academy.trim() !== '');
    return academyList;
  }

  async getMostCuriousButUnreviewedCourses(): Promise<Course[]> {
    // 想了解程度 ÷ 評論數 = 被大量收藏或瀏覽、但評論數很少的課程
    const courses = await CourseModel.findAll({
      attributes: {
        include: [[
          db.Sequelize.literal(`(interests_count * 0.9 + view_count * 0.1) / (review_count + 1)`),
          "curiosity_score"
        ]]
      },
      limit: 5,
      order: [['curiosity_score', 'desc']]
    })
    return courses;
  }

  async decrementCount(
    course_id: number,
    field: "interests_count" | "view_count" | "review_count",
    transaction?: Transaction
  ): Promise<void> {
    await CourseModel.update(
      { [field]: db.Sequelize.literal(`GREATEST(${field} - 1, 0)`) },
      { where: { id: course_id }, transaction }
    );
  }

  async incrementCount(
    course_id: number,
    field: "interests_count" | "view_count" | "review_count",
    transaction?: Transaction
  ): Promise<void> {
    await CourseModel.update(
      { [field]: db.Sequelize.literal(`GREATEST(${field} + 1, 0)`) },
      { where: { id: course_id }, transaction }
    );
  }
}

export default new CourseRepository();
