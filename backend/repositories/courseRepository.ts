import { Op, QueryTypes, Transaction } from "sequelize";
import CourseModel from "../models/Course";
import CourseScheduleModel from "../models/CourseSchedule";
import {
  Course,
  CourseOptionFilters,
  PaginationParams,
  ReviewRequestCourseRow,
} from "../types/course";
import db from "../models";
import { REVIEW_REQUEST_CONFIG } from "../config/reviewRequest";
import {
  EWANT_DEPARTMENT,
  normalizeCourseSchedule,
  PERIOD_ORDER,
} from "../utils/courseSchedule";

const PERIOD_INDEX_MAP = PERIOD_ORDER.reduce<Record<string, number>>((acc, period, index) => {
  acc[period] = index;
  return acc;
}, {});

const INTEREST_WEIGHT_CASE_SQL = REVIEW_REQUEST_CONFIG.interestWeights
  .map(({ maxAgeDays, weight }) => (
    `WHEN interests.created_at >= DATE_SUB(NOW(), INTERVAL ${maxAgeDays} DAY) THEN ${weight}`
  ))
  .join("\n              ");

const REVIEW_NEED_FACTOR_CASE_SQL = REVIEW_REQUEST_CONFIG.reviewNeedFactors
  .map(({ maxReviewCount, factor }) => (
    `WHEN courses.review_count <= ${maxReviewCount} THEN ${factor}`
  ))
  .join("\n          ");

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

  async findSemestersByIds(
    courseIds: number[],
    transaction: Transaction
  ): Promise<Array<{ id: number; semester: string }>> {
    if (courseIds.length === 0) return [];

    return await CourseModel.findAll({
      attributes: ["id", "semester"],
      where: { id: { [Op.in]: courseIds } },
      transaction,
      raw: true,
    });
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

  async getReviewRequestCourses(
    semester: string,
    limit: number,
    transaction?: Transaction
  ): Promise<ReviewRequestCourseRow[]> {
    const query = `
      SELECT
        ranked.id,
        ranked.course_name,
        ranked.department,
        ranked.instructor,
        ranked.review_count,
        ranked.recentInterestCount,
        ranked.weightedFavoriteScore,
        ranked.timetableCount,
        ranked.demandScore * ranked.reviewNeedFactor AS reviewRequestScore
      FROM (
        SELECT
          courses.id,
          courses.course_name,
          courses.department,
          courses.instructor,
          courses.review_count,
          COALESCE(interest_signals.recentInterestCount, 0) AS recentInterestCount,
          COALESCE(interest_signals.weightedFavoriteScore, 0) AS weightedFavoriteScore,
          COALESCE(auth_timetable_signals.authenticatedTimetableCount, 0)
            + COALESCE(guest_timetable_signals.guestTimetableCount, 0) AS timetableCount,
          COALESCE(interest_signals.weightedFavoriteScore, 0)
            + COALESCE(auth_timetable_signals.authenticatedTimetableCount, 0)
            + COALESCE(guest_timetable_signals.guestTimetableCount, 0) AS demandScore,
          CASE
            ${REVIEW_NEED_FACTOR_CASE_SQL}
            ELSE ${REVIEW_REQUEST_CONFIG.minimumReviewNeedFactor}
          END AS reviewNeedFactor
        FROM Courses AS courses
        LEFT JOIN (
          SELECT
            interests.course_id,
            COUNT(*) AS recentInterestCount,
            SUM(
              CASE
                ${INTEREST_WEIGHT_CASE_SQL}
                ELSE 0
              END
            ) AS weightedFavoriteScore
          FROM Interests AS interests
          INNER JOIN Courses AS interest_courses
            ON interest_courses.id = interests.course_id
            AND interest_courses.semester = :semester
          WHERE interests.created_at >= DATE_SUB(NOW(), INTERVAL :interestTtlDays DAY)
          GROUP BY interests.course_id
        ) AS interest_signals ON interest_signals.course_id = courses.id
        LEFT JOIN (
          SELECT
            timetable_items.course_id,
            COUNT(DISTINCT timetable_items.timetable_id) AS authenticatedTimetableCount
          FROM TimetableItems AS timetable_items
          INNER JOIN Timetables AS timetables
            ON timetables.id = timetable_items.timetable_id
          WHERE timetables.semester = :semester
          GROUP BY timetable_items.course_id
        ) AS auth_timetable_signals ON auth_timetable_signals.course_id = courses.id
        LEFT JOIN (
          SELECT
            guest_courses.course_id,
            COUNT(DISTINCT guest_snapshots.client_id) AS guestTimetableCount
          FROM GuestTimetableSnapshots AS guest_snapshots
          INNER JOIN JSON_TABLE(
            guest_snapshots.course_ids,
            '$[*]' COLUMNS(course_id INT PATH '$')
          ) AS guest_courses ON TRUE
          WHERE guest_snapshots.semester = :semester
            AND guest_snapshots.last_synced_at >= DATE_SUB(
              NOW(),
              INTERVAL :guestSnapshotTtlDays DAY
            )
          GROUP BY guest_courses.course_id
        ) AS guest_timetable_signals ON guest_timetable_signals.course_id = courses.id
        WHERE courses.semester = :semester
      ) AS ranked
      WHERE ranked.demandScore > 0
      ORDER BY
        reviewRequestScore DESC,
        ranked.timetableCount DESC,
        ranked.weightedFavoriteScore DESC,
        ranked.review_count ASC,
        ranked.id DESC
      LIMIT :limit
    `;

    return await db.sequelize.query<ReviewRequestCourseRow>(query, {
      replacements: {
        semester,
        limit,
        interestTtlDays: REVIEW_REQUEST_CONFIG.interestWeights[
          REVIEW_REQUEST_CONFIG.interestWeights.length - 1
        ].maxAgeDays,
        guestSnapshotTtlDays: REVIEW_REQUEST_CONFIG.guestSnapshotTtlDays,
      },
      type: QueryTypes.SELECT,
      transaction,
    });
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
