import {
  Course,
  CourseDetailResponse,
  CourseListResult,
  CourseOptionFilters,
  CourseWithTimeslots,
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

  // NOTE: 暫時移除此功能
  async getMostCuriousButUnreviewedCourses(): Promise<Course[]>{
    return await CourseRepository.getMostCuriousButUnreviewedCourses();
  }

  async addViewCount(course_id: number): Promise<void>{
    await CourseRepository.incrementCount(course_id, "view_count");
  }
}

export default new CourseService();
