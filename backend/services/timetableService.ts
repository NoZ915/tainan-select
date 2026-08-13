import CourseScheduleModel from "../models/CourseSchedule";
import db from "../models";
import CourseRepository from "../repositories/courseRepository";
import CourseScheduleRepository from "../repositories/courseScheduleRepository";
import InterestRepository from "../repositories/interestRepository";
import TimetableItemRepository from "../repositories/timetableItemRepository";
import TimetableRepository from "../repositories/timetableRepository";
import { UniqueConstraintError } from "sequelize";
import {
  AddedCourseItemResponse,
  CourseTimeslot,
  TimetableConflict,
  TimetableItemResponse,
  TimetableResponse,
} from "../types/timetable";
import {
  buildTimetableConflict,
  hasTimeslotOverlap,
  isEwantDepartment,
  normalizeCourseSchedule,
} from "../utils/courseSchedule";

type CourseMeta = {
  id: number;
  name: string;
  semester: string;
  department: string;
  instructor: string;
  room?: string;
};

type CourseWithTimeslots = {
  course: CourseMeta;
  timeslots: CourseTimeslot[];
};

export class TimetableServiceError extends Error {
  status: number;
  payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

class TimetableService {
  private async getOrThrowOwnedTimetable(timetableId: number, userId: number) {
    const timetable = await TimetableRepository.findByIdAndUser(timetableId, userId);
    if (!timetable) {
      throw new TimetableServiceError(404, "找不到課表");
    }
    return timetable;
  }

  private toCourseWithTimeslotsMap(
    courses: CourseMeta[],
    schedules: CourseScheduleModel[]
  ): Map<number, CourseWithTimeslots> {
    const map = new Map<number, CourseWithTimeslots>();

    courses.forEach((course) => {
      map.set(course.id, { course, timeslots: [] });
    });

    schedules.forEach((schedule) => {
      const target = map.get(schedule.course_id);
      if (!target || isEwantDepartment(target.course.department)) return;
      const normalized = normalizeCourseSchedule(schedule);
      if (!normalized) return;
      target.timeslots.push(normalized);
    });

    return map;
  }

  private findConflicts(candidate: CourseWithTimeslots, existingCourses: CourseWithTimeslots[]): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    existingCourses.forEach((existing) => {
      candidate.timeslots.forEach((candidateSlot) => {
        existing.timeslots.forEach((existingSlot) => {
          if (!hasTimeslotOverlap(candidateSlot, existingSlot)) return;
          conflicts.push(buildTimetableConflict(candidate.course.id, existing.course.id, candidateSlot, existingSlot));
        });
      });
    });

    return conflicts;
  }

  private async buildTimetableResponse(timetableId: number, semester: string): Promise<TimetableResponse> {
    const items = await TimetableItemRepository.getAllByTimetableId(timetableId);
    const courseIds = items.map((item) => item.course_id);
    const schedules = await CourseScheduleRepository.getByCourseIds(courseIds);

    const scheduleMap = schedules.reduce<Map<number, CourseTimeslot[]>>((map, schedule) => {
      const normalized = normalizeCourseSchedule(schedule);
      if (!normalized) return map;

      const current = map.get(schedule.course_id) ?? [];
      current.push(normalized);
      map.set(schedule.course_id, current);
      return map;
    }, new Map<number, CourseTimeslot[]>());

    const responseItems: TimetableItemResponse[] = items.map((item) => {
      const rawItem = item.toJSON() as unknown as TimetableItemModelJson;
      const course = rawItem.course;

      return {
        course: {
          id: course.id,
          name: course.course_name,
          semester: course.semester,
          department: course.department,
          instructor: course.instructor,
          room: course.course_room,
        },
        timeslots: isEwantDepartment(course.department) ? [] : scheduleMap.get(course.id) ?? [],
      };
    });

    return {
      timetable: {
        id: timetableId,
        semester,
      },
      items: responseItems,
    };
  }

  async getOrCreateTimetable(userId: number, semester: string): Promise<TimetableResponse> {
    const trimmedSemester = semester.trim();
    if (!trimmedSemester) {
      throw new TimetableServiceError(400, "semester 不能為空");
    }

    const timetable = await TimetableRepository.findOrCreateByUserAndSemester(userId, trimmedSemester);
    return await this.buildTimetableResponse(timetable.id, timetable.semester);
  }

  async addCourse(timetableId: number, userId: number, courseId: number) {
    const timetable = await this.getOrThrowOwnedTimetable(timetableId, userId);
    const course = await CourseRepository.getCourse(courseId);
    if (!course) {
      throw new TimetableServiceError(404, "找不到課程");
    }

    if (course.semester !== timetable.semester) {
      throw new TimetableServiceError(409, "只能加入相同學期的課程");
    }

    const existingItem = await TimetableItemRepository.findByTimetableAndCourse(timetable.id, course.id);
    if (existingItem) {
      return {
        added: false,
        alreadyExists: true,
        conflicts: [],
      };
    }

    const timetableItems = await TimetableItemRepository.getAllByTimetableId(timetable.id);
    const existingCourseIds = timetableItems.map((item) => item.course_id);
    const allCourseIds = [...new Set([...existingCourseIds, course.id])];
    const schedules = await CourseScheduleRepository.getByCourseIds(allCourseIds);

    const existingCourses: CourseMeta[] = timetableItems.map((item) => {
      const raw = item.toJSON() as unknown as TimetableItemModelJson;
      return {
        id: raw.course.id,
        name: raw.course.course_name,
        semester: raw.course.semester,
        department: raw.course.department,
        instructor: raw.course.instructor,
        room: raw.course.course_room,
      };
    });
    const candidateCourse: CourseMeta = {
      id: course.id,
      name: course.course_name,
      semester: course.semester,
      department: course.department,
      instructor: course.instructor,
      room: course.course_room,
    };

    const allMap = this.toCourseWithTimeslotsMap([candidateCourse, ...existingCourses], schedules);
    const candidate = allMap.get(candidateCourse.id) ?? { course: candidateCourse, timeslots: [] };
    const existingWithTimeslots = existingCourses.map((meta) => allMap.get(meta.id) ?? { course: meta, timeslots: [] });

    // 缺時段資料（timeslots = []）不參與衝堂判斷，因為無法比較時段
    const conflicts = this.findConflicts(candidate, existingWithTimeslots);
    if (conflicts.length > 0) {
      return {
        added: false,
        alreadyExists: false,
        conflicts,
      };
    }

    try {
      await TimetableItemRepository.addCourse(timetable.id, course.id);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const duplicated = await TimetableItemRepository.findByTimetableAndCourse(timetable.id, course.id);
        if (duplicated) {
          return {
            added: false,
            alreadyExists: true,
            conflicts: [],
          };
        }
      }
      throw error;
    }

    return {
      added: true,
      alreadyExists: false,
      item: { courseId: course.id },
      conflicts: [],
    };
  }

  async swapCourse(timetableId: number, userId: number, courseId: number) {
    const timetable = await this.getOrThrowOwnedTimetable(timetableId, userId);
    const course = await CourseRepository.getCourse(courseId);
    if (!course) {
      throw new TimetableServiceError(404, "找不到課程");
    }

    if (course.semester !== timetable.semester) {
      throw new TimetableServiceError(409, "只能加入相同學期的課程");
    }

    const candidateCourse: CourseMeta = {
      id: course.id,
      name: course.course_name,
      semester: course.semester,
      department: course.department,
      instructor: course.instructor,
      room: course.course_room,
    };

    try {
      return await db.sequelize.transaction(async (transaction) => {
        const existingItem = await TimetableItemRepository.findByTimetableAndCourse(timetable.id, course.id, transaction);
        if (existingItem) {
          return {
            added: false,
            alreadyExists: true,
            removedCourseIds: [] as number[],
          };
        }

        const timetableItems = await TimetableItemRepository.getAllByTimetableId(timetable.id, transaction);
        const existingCourses: CourseMeta[] = timetableItems.map((item) => {
          const raw = item.toJSON() as unknown as TimetableItemModelJson;
          return {
            id: raw.course.id,
            name: raw.course.course_name,
            semester: raw.course.semester,
            department: raw.course.department,
            instructor: raw.course.instructor,
            room: raw.course.course_room,
          };
        });

        const allCourseIds = [...new Set([...existingCourses.map((item) => item.id), candidateCourse.id])];
        const schedules = await CourseScheduleRepository.getByCourseIds(allCourseIds);
        const allMap = this.toCourseWithTimeslotsMap([candidateCourse, ...existingCourses], schedules);
        const candidate = allMap.get(candidateCourse.id) ?? { course: candidateCourse, timeslots: [] };
        const existingWithTimeslots = existingCourses.map((meta) => allMap.get(meta.id) ?? { course: meta, timeslots: [] });

        const conflicts = this.findConflicts(candidate, existingWithTimeslots);
        const conflictCourseIds = Array.from(new Set(conflicts.map((item) => item.conflictWithCourseId)));

        for (const conflictCourseId of conflictCourseIds) {
          await TimetableItemRepository.removeCourse(timetable.id, conflictCourseId, transaction);
        }

        await TimetableItemRepository.addCourse(timetable.id, course.id, transaction);

        return {
          added: true,
          alreadyExists: false,
          removedCourseIds: conflictCourseIds,
        };
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const existingItem = await TimetableItemRepository.findByTimetableAndCourse(timetable.id, course.id);
        if (existingItem) {
          return {
            added: false,
            alreadyExists: true,
            removedCourseIds: [] as number[],
          };
        }
      }
      throw error;
    }
  }

  async batchAddFromInterests(timetableId: number, userId: number) {
    const timetable = await this.getOrThrowOwnedTimetable(timetableId, userId);
    const allInterests = await InterestRepository.getAllInterestsByUserId(userId);
    const requested = allInterests.length;
    const eligibleInterests = allInterests.filter((interest) => interest.course.semester === timetable.semester);

    const existingItems = await TimetableItemRepository.getAllByTimetableId(timetable.id);
    const existingCourseIds = new Set(existingItems.map((item) => item.course_id));

    const candidateCourses: CourseMeta[] = eligibleInterests.map((interest) => ({
      id: interest.course.id,
      name: interest.course.course_name,
      semester: interest.course.semester,
      department: interest.course.department,
      instructor: interest.course.instructor,
    }));
    const existingCourses: CourseMeta[] = existingItems.map((item) => {
      const raw = item.toJSON() as unknown as TimetableItemModelJson;
      return {
        id: raw.course.id,
        name: raw.course.course_name,
        semester: raw.course.semester,
        department: raw.course.department,
        instructor: raw.course.instructor,
        room: raw.course.course_room,
      };
    });

    const allCourseIds = [...new Set([...existingCourseIds, ...candidateCourses.map((course) => course.id)])];
    const schedules = await CourseScheduleRepository.getByCourseIds(allCourseIds);
    const courseMap = this.toCourseWithTimeslotsMap([...existingCourses, ...candidateCourses], schedules);

    const selectedCourseIds = new Set(existingCourses.map((course) => course.id));
    const selectedCourses = [...existingCourses].map((course) => courseMap.get(course.id) ?? { course, timeslots: [] });
    const conflicts: TimetableConflict[] = [];
    let added = 0;
    let skippedAlreadyExists = 0;
    let conflicted = 0;

    for (const candidateMeta of candidateCourses) {
      if (selectedCourseIds.has(candidateMeta.id)) {
        skippedAlreadyExists += 1;
        continue;
      }

      const candidate = courseMap.get(candidateMeta.id) ?? { course: candidateMeta, timeslots: [] };
      const detected = this.findConflicts(candidate, selectedCourses);

      if (detected.length > 0) {
        conflicted += 1;
        conflicts.push(...detected);
        continue;
      }

      await TimetableItemRepository.addCourse(timetable.id, candidateMeta.id);
      added += 1;
      selectedCourseIds.add(candidateMeta.id);
      selectedCourses.push(candidate);
    }

    return {
      summary: {
        requested,
        eligibleSameSemester: eligibleInterests.length,
        added,
        skippedAlreadyExists,
        conflicted,
      },
      conflicts,
    };
  }

  async removeCourse(timetableId: number, userId: number, courseId: number): Promise<void> {
    await this.getOrThrowOwnedTimetable(timetableId, userId);
    await TimetableItemRepository.removeCourse(timetableId, courseId);
  }

  async getAllAddedCourses(userId: number): Promise<AddedCourseItemResponse[]> {
    const items = await TimetableItemRepository.getAllByUserId(userId);
    const courseIds = Array.from(new Set(items.map((item) => item.course_id)));
    const schedules = await CourseScheduleRepository.getByCourseIds(courseIds);
    const hasTimeslotsSet = new Set(
      schedules
        .filter((schedule) => normalizeCourseSchedule(schedule) !== null)
        .map((schedule) => schedule.course_id)
    );

    return items.map((item) => {
      const raw = item.toJSON() as unknown as TimetableItemWithSemesterJson;
      return {
        timetableId: raw.timetable.id,
        semester: raw.timetable.semester,
        hasTimeslots: !isEwantDepartment(raw.course.department) && hasTimeslotsSet.has(raw.course.id),
        course: {
          id: raw.course.id,
          name: raw.course.course_name,
          semester: raw.course.semester,
          department: raw.course.department,
          instructor: raw.course.instructor,
          room: raw.course.course_room,
          courseTime: raw.course.course_time,
        },
      };
    });
  }
}

type TimetableItemModelJson = {
  course_id: number;
  course: {
    id: number;
    course_name: string;
    semester: string;
    department: string;
    instructor: string;
    course_time?: string;
    course_room?: string;
  };
};

type TimetableItemWithSemesterJson = TimetableItemModelJson & {
  timetable: {
    id: number;
    semester: string;
    user_id: number;
  };
};

export default new TimetableService();
