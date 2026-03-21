import { Op, Transaction } from "sequelize";
import CourseModel from "../models/Course";
import CourseScheduleModel from "../models/CourseSchedule";
import { Course } from "../types/course";
import { PaginationParams } from "../types/course";
import db from "../models";

const PERIOD_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G"] as const;
const PERIOD_INDEX_MAP = PERIOD_ORDER.reduce<Record<string, number>>((acc, period, index) => {
  acc[period] = index;
  return acc;
}, {});

class CourseRepository {
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
      const startIndex = PERIOD_INDEX_MAP[row.start_period as string];
      if (typeof startIndex !== "number") return;

      if (selectedPeriods.size === 0) {
        matchedCourseIds.add(Number(row.course_id));
        return;
      }

      const span = Math.max(Number(row.span) || 1, 1);
      const endIndex = startIndex + span - 1;
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
          { department: { [Op.notLike]: "校外遠距(EWANT)" } },
        ]
      });
    } else if (search && search.category === "graduate") {
      categoryConditions.push({ department: { [Op.like]: "%碩士%" } });
    } else if (search && search.category === "teacher") {
      categoryConditions.push({ department: { [Op.like]: "%師%" } });
    }
    if (search && search.category === "ewant") {
      categoryConditions.push({ department: "校外遠距(EWANT)" });
    }
    if (search && search.department) {
      categoryConditions.push({ department: search.department });
    }
    if (categoryConditions.length > 0) {
      whereCondition[Op.and] = categoryConditions;
    }

    if (search && search.academy) whereCondition.academy = search.academy;
    if (search && search.courseType) whereCondition.course_type = search.courseType;
    if (search && search.semesters.length > 0) whereCondition.semester = { [Op.in]: search.semesters };

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
