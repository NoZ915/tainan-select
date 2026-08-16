import { Op, Transaction } from "sequelize";
import CourseModel from "../models/Course";
import CourseScheduleModel from "../models/CourseSchedule";
import { Course, CourseOptionFilters, PaginationParams } from "../types/course";
import db from "../models";
import {
  EWANT_DEPARTMENT,
  normalizeCourseSchedule,
  PERIOD_ORDER,
} from "../utils/courseSchedule";

const PERIOD_INDEX_MAP = PERIOD_ORDER.reduce<Record<string, number>>((acc, period, index) => {
  acc[period] = index;
  return acc;
}, {});

const getCategoryConditions = (category?: string): any[] => {
  if (category === "general") {
    return [{ department: { [Op.like]: "%通識%" } }];
  }
  if (category === "university") {
    return [{
      [Op.and]: [
        { department: { [Op.notLike]: "%碩士%" } },
        { department: { [Op.notLike]: "%通識%" } },
        { department: { [Op.notLike]: EWANT_DEPARTMENT } },
      ],
    }];
  }
  if (category === "graduate") {
    return [{ department: { [Op.like]: "%碩士%" } }];
  }
  if (category === "teacher") {
    return [{ department: { [Op.like]: "%師%" } }];
  }
  if (category === "ewant") {
    return [{ department: EWANT_DEPARTMENT }];
  }
  return [];
};

const LEADING_NUMERAL_MAP: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 };

// 開課班別選項排序：開頭是一二三四的（如「一A學程」）依數字排序在前，其餘（如「教育實習」）依字母排序放後面
const compareClassNames = (a: string, b: string): number => {
  const numA = LEADING_NUMERAL_MAP[a[0]] ?? Infinity;
  const numB = LEADING_NUMERAL_MAP[b[0]] ?? Infinity;
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b, "zh-Hant");
};

class CourseRepository {
  private getCourseOptionWhere = (
    filters: CourseOptionFilters,
    excludeEwantWhenUnfiltered = false
  ): any => {
    const whereCondition: any = {};
    const categoryConditions = getCategoryConditions(filters.category);

    if (excludeEwantWhenUnfiltered && (!filters.category || filters.category === "all")) {
      categoryConditions.push({ department: { [Op.ne]: EWANT_DEPARTMENT } });
    }
    if (categoryConditions.length > 0) {
      whereCondition[Op.and] = categoryConditions;
    }
    if (filters.academy) whereCondition.academy = filters.academy;
    if (filters.semesters && filters.semesters.length > 0) {
      whereCondition.semester = { [Op.in]: filters.semesters };
    }

    return whereCondition;
  };

  // 用 MySQL JSON_CONTAINS 檢查 JSON 陣列欄位（grades / graduate_levels）是否包含指定值
  private jsonArrayContains = (column: string, value: string | number): any => {
    return db.sequelize.where(
      db.Sequelize.fn("JSON_CONTAINS", db.Sequelize.col(column), JSON.stringify(value)),
      1
    );
  };

  private getFilteredCourseIdsBySchedule = async (
    weekdays: number[],
    periods: string[]
  ): Promise<number[] | null> => {
    if (weekdays.length === 0 && periods.length === 0) return null;

    const scheduleRows = await CourseScheduleModel.findAll({
      attributes: ["course_id", "day", "start_period", "span"],
      where: weekdays.length > 0 ? { day: { [Op.in]: weekdays } } : undefined,
      raw: true,
    });

    const selectedPeriods = new Set(
      periods
        .map((period) => period.toUpperCase())
        .filter((period) => Object.prototype.hasOwnProperty.call(PERIOD_INDEX_MAP, period))
    );

    const matchedCourseIds = new Set<number>();
    scheduleRows.forEach((row) => {
      const normalizedSchedule = normalizeCourseSchedule(row);
      if (!normalizedSchedule) return;

      if (selectedPeriods.size === 0) {
        matchedCourseIds.add(Number(row.course_id));
        return;
      }

      const startIndex = PERIOD_INDEX_MAP[normalizedSchedule.startPeriod];
      const endIndex = PERIOD_INDEX_MAP[normalizedSchedule.endPeriod];
      for (let index = startIndex; index <= endIndex; index += 1) {
        const period = PERIOD_ORDER[index];
        if (period && selectedPeriods.has(period)) {
          matchedCourseIds.add(Number(row.course_id));
          return;
        }
      }
    });

    return [...matchedCourseIds];
  };

  async getAllCourses({
    limit,
    offset,
    search,
  }: PaginationParams): Promise<{ courses: CourseModel[]; total: number }> {
    const whereCondition: any = {};
    if (search && search.search) {
      whereCondition[Op.or] = [
        { course_name: { [Op.like]: `%${search.search.toLowerCase()}%` } },
        { instructor: { [Op.like]: `%${search.search.toLowerCase()}%` } },
      ];
    }

    // category(tab選項)filter與department有關
    const categoryConditions = getCategoryConditions(search?.category);
    if (search && search.department) {
      categoryConditions.push({ department: search.department });
    }
    if (categoryConditions.length > 0) {
      whereCondition[Op.and] = categoryConditions;
    }

    if (search && search.academy) whereCondition.academy = search.academy;
    if (search && search.courseType) whereCondition.course_type = search.courseType;
    if (search && search.semesters.length > 0) whereCondition.semester = { [Op.in]: search.semesters };

    if (search && search.grades && search.grades.length > 0) {
      whereCondition[Op.and] = [
        ...(whereCondition[Op.and] ?? []),
        { [Op.or]: search.grades.map((grade) => this.jsonArrayContains("grades", grade)) },
      ];
    }
    if (search && search.graduateLevels && search.graduateLevels.length > 0) {
      whereCondition[Op.and] = [
        ...(whereCondition[Op.and] ?? []),
        { [Op.or]: search.graduateLevels.map((level) => this.jsonArrayContains("graduate_levels", level)) },
      ];
    }
    if (search && search.classNames && search.classNames.length > 0) {
      whereCondition.class_name = { [Op.in]: search.classNames };
    }

    const filteredByScheduleIds = await this.getFilteredCourseIdsBySchedule(search?.weekdays ?? [], search?.periods ?? []);
    if (filteredByScheduleIds) {
      if (filteredByScheduleIds.length === 0) return { courses: [], total: 0 };
      whereCondition.id = { [Op.in]: filteredByScheduleIds };
    }

    // 排序功能
    let order: any[] = [];
    let primarySort: "reviewDesc" | "interestDesc" | "viewDesc" | "dcardPostDesc" | "default" = "default";
    switch(search?.sortBy){
      case "reviewDesc":
        order.push(["review_count", "desc"]);
        primarySort = "reviewDesc";
        break;
      case "interestDesc":
        order.push(["interests_count", "desc"]);
        primarySort = "interestDesc";
        break;
      case "viewDesc":
        order.push(["view_count", "desc"]);
        primarySort = "viewDesc";
        break;
      case "dcardPostDesc":
        order.push(["dcard_related_post_count", "desc"]);
        primarySort = "dcardPostDesc";
        break;
      default:
        order.push(["review_count", "desc"]);
        primarySort = "reviewDesc";
        break;
    }
    if (primarySort !== "interestDesc") {
      order.push(["interests_count", "desc"]);
    }
    order.push(["created_at", "desc"]);
    order.push(["id", "desc"]);

    const [courses, total] = await Promise.all([
      CourseModel.findAll({ where: whereCondition, limit, offset, order }),
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

  async getAllCoursesCount(): Promise<number> {
    return await CourseModel.count();
  }

  async getAllDepartments(filters: CourseOptionFilters = {}): Promise<string[]> {
    const departments = await CourseModel.findAll({
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("department")), "department"]],
      where: this.getCourseOptionWhere(filters, true),
      raw: true
    });
    const departmentList = departments.map((item: { department: string }) => {
      return item.department
    })
    return departmentList;
  }

  async getAllClassNames(filters: CourseOptionFilters = {}): Promise<string[]> {
    const whereCondition = this.getCourseOptionWhere(filters);
    whereCondition.class_name = { [Op.ne]: null };
    const classNames = await CourseModel.findAll({
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("class_name")), "class_name"]],
      where: whereCondition,
      raw: true
    });
    const classNameList = classNames
      .map((item: { class_name?: string | null }) => item.class_name)
      .filter((className): className is string => className != null && className.trim() !== '');
    return classNameList.sort(compareClassNames);
  }

  async getAllAcademies(filters: CourseOptionFilters = {}): Promise<string[]> {
    const academies = await CourseModel.findAll({
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("academy")), "academy"]],
      where: this.getCourseOptionWhere(filters, true),
      raw: true
    });
    const academyList = academies
      .map((item: { academy?: string }) => item.academy)
      .filter((academy): academy is string => academy != null && academy.trim() !== '');
    return academyList;
  }

  async getAllSemesters(): Promise<string[]> {
    const semesters = await CourseModel.findAll({
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("semester")), "semester"]],
      raw: true,
    });
    return semesters
      .map((item: { semester: string }) => item.semester)
      .filter((semester): semester is string => Boolean(semester));
  }

  // NOTE: 暫時移除此功能
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
    field: "interests_count" | "view_count" | "review_count" | "dcard_related_post_count",
    transaction?: Transaction
  ): Promise<void> {
    await CourseModel.update(
      { [field]: db.Sequelize.literal(`GREATEST(${field} - 1, 0)`) },
      { where: { id: course_id }, transaction }
    );
  }

  async incrementCount(
    course_id: number,
    field: "interests_count" | "view_count" | "review_count" | "dcard_related_post_count",
    transaction?: Transaction
  ): Promise<void> {
    await CourseModel.update(
      { [field]: db.Sequelize.literal(`GREATEST(${field} + 1, 0)`) },
      { where: { id: course_id }, transaction }
    );
  }

  async recalculateDcardRelatedPostCounts(courseIds: number[], transaction?: Transaction): Promise<void> {
    const normalizedCourseIds = [...new Set(
      courseIds
        .map((courseId) => Number(courseId))
        .filter((courseId) => Number.isInteger(courseId) && courseId > 0)
    )];

    if (normalizedCourseIds.length === 0) return;

    await CourseModel.update(
      {
        dcard_related_post_count: db.Sequelize.literal(`(
          SELECT COUNT(*)
          FROM CourseRelatedPosts AS crp
          WHERE crp.course_id = Courses.id
            AND (
              LOWER(COALESCE(crp.preview_site_name, '')) LIKE '%dcard%'
              OR LOWER(COALESCE(crp.post_url, '')) LIKE '%dcard.tw%'
            )
        )`),
      },
      {
        where: { id: { [Op.in]: normalizedCourseIds } },
        transaction,
      }
    );
  }
}

export default new CourseRepository();
