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

type CourseMeta = {
  id: number;
  name: string;
  semester: string;
  instructor: string;
  room?: string;
};

type CourseWithTimeslots = {
  course: CourseMeta;
  timeslots: CourseTimeslot[];
};

const PERIOD_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G"];
const PERIOD_INDEX_MAP = PERIOD_ORDER.reduce<Record<string, number>>((map, period, index) => {
  map[period] = index;
  return map;
}, {});
const PERIOD_MIN_MAP: Record<string, { start: number; end: number }> = {
  "1": { start: 430, end: 480 },
  "2": { start: 480, end: 530 },
  "3": { start: 540, end: 590 },
  "4": { start: 600, end: 650 },
  "5": { start: 660, end: 710 },
  "6": { start: 720, end: 770 },
  "7": { start: 780, end: 830 },
  "8": { start: 840, end: 890 },
  "9": { start: 900, end: 950 },
  A: { start: 960, end: 1010 },
  B: { start: 1020, end: 1070 },
  C: { start: 1110, end: 1160 },
  D: { start: 1160, end: 1210 },
  E: { start: 1210, end: 1260 },
  F: { start: 1260, end: 1310 },
  G: { start: 1310, end: 1360 },
};

const getPeriodByMinute = (minute: number, mode: "start" | "end"): string => {
  if (mode === "start") {
    const found = PERIOD_ORDER.find((period) => PERIOD_MIN_MAP[period].start <= minute && minute < PERIOD_MIN_MAP[period].end);
    return found ?? PERIOD_ORDER[0];
  }

  const found = [...PERIOD_ORDER].reverse().find((period) => PERIOD_MIN_MAP[period].start < minute && minute <= PERIOD_MIN_MAP[period].end);
  return found ?? PERIOD_ORDER[PERIOD_ORDER.length - 1];
};

const normalizeSchedule = (schedule: CourseScheduleModel): CourseTimeslot | null => {
  const startIndex = PERIOD_INDEX_MAP[schedule.start_period];
  if (typeof startIndex !== "number") return null;

  const endIndex = startIndex + Math.max(schedule.span, 1) - 1;
  if (endIndex >= PERIOD_ORDER.length) return null;

  const startPeriod = PERIOD_ORDER[startIndex];
  const endPeriod = PERIOD_ORDER[endIndex];
  const startMin = PERIOD_MIN_MAP[startPeriod]?.start;
  const endMin = PERIOD_MIN_MAP[endPeriod]?.end;
  if (typeof startMin !== "number" || typeof endMin !== "number") return null;

  return {
    dayOfWeek: schedule.day,
    startPeriod,
    endPeriod,
    startMin,
    endMin,
  };
};

const hasOverlap = (a: CourseTimeslot, b: CourseTimeslot): boolean => {
  return a.dayOfWeek === b.dayOfWeek && a.startMin < b.endMin && b.startMin < a.endMin;
};

const buildConflict = (courseId: number, conflictWithCourseId: number, a: CourseTimeslot, b: CourseTimeslot): TimetableConflict => {
  const overlapStart = Math.max(a.startMin, b.startMin);
  const overlapEnd = Math.min(a.endMin, b.endMin);

  return {
    courseId,
    conflictWithCourseId,
    dayOfWeek: a.dayOfWeek,
    overlap: {
      startMin: overlapStart,
      endMin: overlapEnd,
      startPeriod: getPeriodByMinute(overlapStart, "start"),
      endPeriod: getPeriodByMinute(overlapEnd, "end"),
    },
  };
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
      const normalized = normalizeSchedule(schedule);
      if (!normalized) return;
      const target = map.get(schedule.course_id);
      if (!target) return;
      target.timeslots.push(normalized);
    });

    return map;
  }

  private findConflicts(candidate: CourseWithTimeslots, existingCourses: CourseWithTimeslots[]): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    existingCourses.forEach((existing) => {
      candidate.timeslots.forEach((candidateSlot) => {
        existing.timeslots.forEach((existingSlot) => {
          if (!hasOverlap(candidateSlot, existingSlot)) return;
          conflicts.push(buildConflict(candidate.course.id, existing.course.id, candidateSlot, existingSlot));
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
      const normalized = normalizeSchedule(schedule);
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
          instructor: course.instructor,
          room: course.course_room,
        },
        timeslots: scheduleMap.get(course.id) ?? [],
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
        instructor: raw.course.instructor,
        room: raw.course.course_room,
      };
    });
    const candidateCourse: CourseMeta = {
      id: course.id,
      name: course.course_name,
      semester: course.semester,
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
      instructor: interest.course.instructor,
    }));
    const existingCourses: CourseMeta[] = existingItems.map((item) => {
      const raw = item.toJSON() as unknown as TimetableItemModelJson;
      return {
        id: raw.course.id,
        name: raw.course.course_name,
        semester: raw.course.semester,
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
    const hasTimeslotsSet = new Set(schedules.map((schedule) => schedule.course_id));

    return items.map((item) => {
      const raw = item.toJSON() as unknown as TimetableItemWithSemesterJson;
      return {
        timetableId: raw.timetable.id,
        semester: raw.timetable.semester,
        hasTimeslots: hasTimeslotsSet.has(raw.course.id),
        course: {
          id: raw.course.id,
          name: raw.course.course_name,
          semester: raw.course.semester,
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
