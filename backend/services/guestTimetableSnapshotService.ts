import { Transaction } from "sequelize";
import db from "../models";
import CourseRepository from "../repositories/courseRepository";
import GuestTimetableSnapshotRepository from "../repositories/guestTimetableSnapshotRepository";
import { GUEST_TIMETABLE_SNAPSHOT_CONFIG } from "../config/guestTimetableSnapshot";
import { GuestTimetableSnapshotSyncInput } from "../types/guestTimetableSnapshot";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEMESTER_PATTERN = /^\d{3}-[12]$/;
const snapshotOperationsByClientId = new Map<string, Promise<void>>();

const serializeSnapshotOperation = async (
  clientId: string,
  operation: () => Promise<void>
): Promise<void> => {
  const previousOperation = snapshotOperationsByClientId.get(clientId) ?? Promise.resolve();
  const queuedOperation = previousOperation.catch(() => undefined).then(operation);
  const settledOperation = queuedOperation.then(() => undefined, () => undefined);
  snapshotOperationsByClientId.set(clientId, settledOperation);

  try {
    await queuedOperation;
  } finally {
    if (snapshotOperationsByClientId.get(clientId) === settledOperation) {
      snapshotOperationsByClientId.delete(clientId);
    }
  }
};

export class GuestTimetableSnapshotServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const normalizeGuestSnapshotInput = (input: unknown): GuestTimetableSnapshotSyncInput => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new GuestTimetableSnapshotServiceError(400, "請提供有效的同步資料");
  }

  const { clientId, semesters } = input as Record<string, unknown>;
  if (typeof clientId !== "string" || !UUID_PATTERN.test(clientId)) {
    throw new GuestTimetableSnapshotServiceError(400, "clientId 必須是有效的 UUID");
  }
  if (!semesters || typeof semesters !== "object" || Array.isArray(semesters)) {
    throw new GuestTimetableSnapshotServiceError(400, "semesters 必須是物件");
  }

  const semesterEntries = Object.entries(semesters);
  if (semesterEntries.length > GUEST_TIMETABLE_SNAPSHOT_CONFIG.maxSemestersPerSnapshot) {
    throw new GuestTimetableSnapshotServiceError(
      400,
      `一次最多同步 ${GUEST_TIMETABLE_SNAPSHOT_CONFIG.maxSemestersPerSnapshot} 個學期`
    );
  }

  const normalizedSemesters: Record<string, number[]> = {};
  for (const [semester, rawCourseIds] of semesterEntries) {
    if (!SEMESTER_PATTERN.test(semester)) {
      throw new GuestTimetableSnapshotServiceError(400, `學期格式錯誤：${semester}`);
    }
    if (!Array.isArray(rawCourseIds)) {
      throw new GuestTimetableSnapshotServiceError(400, `${semester} 的 course ID 必須是陣列`);
    }
    if (rawCourseIds.length > GUEST_TIMETABLE_SNAPSHOT_CONFIG.maxCoursesPerSemester) {
      throw new GuestTimetableSnapshotServiceError(
        400,
        `${semester} 最多只能包含 ${GUEST_TIMETABLE_SNAPSHOT_CONFIG.maxCoursesPerSemester} 門課`
      );
    }
    if (!rawCourseIds.every((courseId) => Number.isSafeInteger(courseId) && courseId > 0)) {
      throw new GuestTimetableSnapshotServiceError(400, `${semester} 包含無效的 course ID`);
    }

    normalizedSemesters[semester] = [...new Set(rawCourseIds as number[])];
  }

  return { clientId: clientId.toLowerCase(), semesters: normalizedSemesters };
};

class GuestTimetableSnapshotService {
  async syncGuestSnapshot(input: unknown): Promise<void> {
    const { clientId, semesters } = normalizeGuestSnapshotInput(input);
    const activeEntries = Object.entries(semesters).filter(([, courseIds]) => courseIds.length > 0);

    await serializeSnapshotOperation(clientId, () => db.sequelize.transaction(async (transaction: Transaction) => {
      const requestedCourseIds = [...new Set(activeEntries.flatMap(([, courseIds]) => courseIds))];
      const courses = await CourseRepository.findSemestersByIds(
        requestedCourseIds,
        transaction
      );
      const courseSemesterById = new Map(courses.map((course) => [Number(course.id), course.semester]));

      const validEntries = activeEntries
        .map(([semester, courseIds]) => [
          semester,
          courseIds.filter((courseId) => courseSemesterById.get(courseId) === semester),
        ] as const)
        .filter(([, courseIds]) => courseIds.length > 0);

      const lastSyncedAt = new Date();
      for (const [semester, courseIds] of validEntries) {
        await GuestTimetableSnapshotRepository.upsertSnapshot(
          clientId,
          semester,
          courseIds,
          lastSyncedAt,
          transaction
        );
      }

      await GuestTimetableSnapshotRepository.deleteMissingSemesters(
        clientId,
        validEntries.map(([semester]) => semester),
        transaction
      );
    }));
  }

  async deleteGuestSnapshot(input: unknown): Promise<void> {
    const clientId = normalizeGuestSnapshotInput({
      ...(input && typeof input === "object" ? input : {}),
      semesters: {},
    }).clientId;

    await serializeSnapshotOperation(clientId, () => db.sequelize.transaction(async (transaction: Transaction) => {
      await GuestTimetableSnapshotRepository.deleteByClientId(clientId, transaction);
    }));
  }
}

export default new GuestTimetableSnapshotService();
