import {
  Course,
  CourseDetailResponse,
  CourseListResult,
  CourseOptionFilters,
  CourseWithTimeslots,
  ReviewRequestCoursesResponse,
} from "../types/course";
import { PaginationParams } from "../types/course";
import CourseRepository from "../repositories/courseRepository";
import CourseScheduleRepository from "../repositories/courseScheduleRepository";
import InterestRepository from "../repositories/interestRepository";
import CourseRelatedPostService from "./courseRelatedPostService";
import {
  isEwantDepartment,
  normalizeCourseSchedule,
  normalizeCourseSchedules,
} from "../utils/courseSchedule";
import { REVIEW_REQUEST_CONFIG } from "../config/reviewRequest";

const SEMESTER_PATTERN = /^\d{3}-[12]$/;

export class ReviewRequestServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class CourseService {
  async getAllCourses(params: PaginationParams): Promise<CourseListResult>;
  async getAllCourses(params: PaginationParams, includeTimeslots: false): Promise<CourseListResult>;
  async getAllCourses(params: PaginationParams, includeTimeslots: true): Promise<CourseListResult<CourseWithTimeslots>>;
  async getAllCourses(
    params: PaginationParams,
    includeTimeslots = false
  ): Promise<CourseListResult<Course | CourseWithTimeslots>> {
    const result = await CourseRepository.getAllCourses(params);
    if (!includeTimeslots) return result;

    const courseIds = result.courses.map((course) => course.id);
    const schedules = await CourseScheduleRepository.getByCourseIds(courseIds);
    const timeslotsByCourseId = schedules.reduce<Map<number, CourseWithTimeslots["timeslots"]>>(
      (map, schedule) => {
        const normalized = normalizeCourseSchedule(schedule);
        if (!normalized) return map;

        const current = map.get(schedule.course_id) ?? [];
        current.push(normalized);
        map.set(schedule.course_id, current);
        return map;
      },
      new Map()
    );

    return {
      ...result,
      courses: result.courses.map((course) => ({
        ...(course.toJSON() as Course),
        timeslots: isEwantDepartment(course.department)
          ? []
          : timeslotsByCourseId.get(course.id) ?? [],
      })),
    };
  }

  async getCourse(user_id: number|undefined, course_id: number): Promise<CourseDetailResponse | null>{
    const course = await CourseRepository.getCourse(course_id);
    let hasUserAddInterest = false;

    if (!course) return null;
    if(user_id){
      const interest =  await InterestRepository.findInterest(user_id, course_id);
      if(interest !== null) hasUserAddInterest = true;
    };

    const [related_posts, schedules] = await Promise.all([
      CourseRelatedPostService.getByCourseId(course_id),
      CourseScheduleRepository.getByCourseId(course_id),
    ]);
    const timeslots = isEwantDepartment(course.department)
      ? []
      : normalizeCourseSchedules(schedules);

    return { course, timeslots, hasUserAddInterest, related_posts };
  }

  async getAllDepartments(filters: CourseOptionFilters = {}): Promise<string[]>{
    return await CourseRepository.getAllDepartments(filters);
  }

  async getAllAcademies(filters: CourseOptionFilters = {}): Promise<string[]>{
    return await CourseRepository.getAllAcademies(filters);
  }

  async getAllSemesters(): Promise<string[]>{
    return await CourseRepository.getAllSemesters();
  }

  async getReviewRequestCourses(
    rawSemester: unknown,
    rawLimit: unknown
  ): Promise<ReviewRequestCoursesResponse> {
    const semester = typeof rawSemester === "string" ? rawSemester.trim() : "";
    if (!SEMESTER_PATTERN.test(semester)) {
      throw new ReviewRequestServiceError(400, "semester 格式錯誤");
    }

    const limit = rawLimit === undefined || rawLimit === ""
      ? REVIEW_REQUEST_CONFIG.defaultLimit
      : Number(rawLimit);
    if (
      !Number.isSafeInteger(limit)
      || limit < 1
      || limit > REVIEW_REQUEST_CONFIG.maxLimit
    ) {
      throw new ReviewRequestServiceError(
        400,
        `limit 必須介於 1 與 ${REVIEW_REQUEST_CONFIG.maxLimit} 之間`
      );
    }

    const rows = await CourseRepository.getReviewRequestCourses(semester, limit);
    return {
      semester,
      items: rows.map((row) => ({
        course: {
          id: Number(row.id),
          course_name: row.course_name,
          department: row.department,
          instructor: row.instructor,
          review_count: Number(row.review_count),
        },
        signals: {
          recentInterestCount: Number(row.recentInterestCount),
          weightedFavoriteScore: Number(row.weightedFavoriteScore),
          timetableCount: Number(row.timetableCount),
          reviewCount: Number(row.review_count),
        },
        reviewRequestScore: Number(row.reviewRequestScore),
      })),
    };
  }

  async addViewCount(course_id: number): Promise<void>{
    await CourseRepository.incrementCount(course_id, "view_count");
  }
}

export default new CourseService();
