import { Transaction } from "sequelize";
import db from "../models";
import TimetableAnalyticsRepository from "../repositories/timetableAnalyticsRepository";
import {
  GuestSnapshotSyncInput,
  TIMETABLE_ANALYTICS_CONFIG,
} from "../types/timetableAnalytics";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEMESTER_PATTERN = /^\d{3}-[12]$/;

export class TimetableAnalyticsServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const normalizeGuestSnapshotInput = (input: unknown): GuestSnapshotSyncInput => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TimetableAnalyticsServiceError(400, "請提供有效的同步資料");
  }

  const { clientId, semesters } = input as Record<string, unknown>;
  if (typeof clientId !== "string" || !UUID_PATTERN.test(clientId)) {
    throw new TimetableAnalyticsServiceError(400, "clientId 必須是有效的 UUID");
  }
  if (!semesters || typeof semesters !== "object" || Array.isArray(semesters)) {
    throw new TimetableAnalyticsServiceError(400, "semesters 必須是物件");
  }

  const semesterEntries = Object.entries(semesters);
  if (semesterEntries.length > TIMETABLE_ANALYTICS_CONFIG.maxSemestersPerSnapshot) {
    throw new TimetableAnalyticsServiceError(
      400,
      `一次最多同步 ${TIMETABLE_ANALYTICS_CONFIG.maxSemestersPerSnapshot} 個學期`
    );
  }

  const normalizedSemesters: Record<string, number[]> = {};
  for (const [semester, rawCourseIds] of semesterEntries) {
    if (!SEMESTER_PATTERN.test(semester)) {
      throw new TimetableAnalyticsServiceError(400, `學期格式錯誤：${semester}`);
    }
    if (!Array.isArray(rawCourseIds)) {
      throw new TimetableAnalyticsServiceError(400, `${semester} 的 course ID 必須是陣列`);
    }
    if (rawCourseIds.length > TIMETABLE_ANALYTICS_CONFIG.maxCoursesPerSemester) {
      throw new TimetableAnalyticsServiceError(
        400,
        `${semester} 最多只能包含 ${TIMETABLE_ANALYTICS_CONFIG.maxCoursesPerSemester} 門課`
      );
    }
    if (!rawCourseIds.every((courseId) => Number.isSafeInteger(courseId) && courseId > 0)) {
      throw new TimetableAnalyticsServiceError(400, `${semester} 包含無效的 course ID`);
    }

    normalizedSemesters[semester] = [...new Set(rawCourseIds as number[])];
  }

  return { clientId: clientId.toLowerCase(), semesters: normalizedSemesters };
};

class TimetableAnalyticsService {
  async syncGuestSnapshot(input: unknown): Promise<void> {
    const { clientId, semesters } = normalizeGuestSnapshotInput(input);
    const activeEntries = Object.entries(semesters).filter(([, courseIds]) => courseIds.length > 0);

    await db.sequelize.transaction(async (transaction: Transaction) => {
      const requestedCourseIds = [...new Set(activeEntries.flatMap(([, courseIds]) => courseIds))];
      const courses = await TimetableAnalyticsRepository.findCoursesByIds(
        requestedCourseIds,
        transaction
      );
      const courseSemesterById = new Map(courses.map((course) => [Number(course.id), course.semester]));

      for (const [semester, courseIds] of activeEntries) {
        const invalidCourseId = courseIds.find(
          (courseId) => courseSemesterById.get(courseId) !== semester
        );
        if (invalidCourseId !== undefined) {
          throw new TimetableAnalyticsServiceError(
            400,
            `course ID ${invalidCourseId} 不存在或不屬於 ${semester}`
          );
        }
      }

      const lastSyncedAt = new Date();
      for (const [semester, courseIds] of activeEntries) {
        await TimetableAnalyticsRepository.upsertSnapshot(
          clientId,
          semester,
          courseIds,
          lastSyncedAt,
          transaction
        );
      }

      await TimetableAnalyticsRepository.deleteMissingSemesters(
        clientId,
        activeEntries.map(([semester]) => semester),
        transaction
      );
    });
  }

  async deleteGuestSnapshot(input: unknown): Promise<void> {
    const clientId = normalizeGuestSnapshotInput({
      ...(input && typeof input === "object" ? input : {}),
      semesters: {},
    }).clientId;

    await db.sequelize.transaction(async (transaction: Transaction) => {
      await TimetableAnalyticsRepository.deleteByClientId(clientId, transaction);
    });
  }
}

export default new TimetableAnalyticsService();
