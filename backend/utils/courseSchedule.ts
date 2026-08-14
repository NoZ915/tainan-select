import type CourseScheduleModel from "../models/CourseSchedule";
import type { CourseTimeslot, TimetableConflict } from "../types/timetable";

export const EWANT_DEPARTMENT = "校外遠距(EWANT)";

export const PERIOD_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G"];
const PERIOD_INDEX_MAP = PERIOD_ORDER.reduce<Record<string, number>>((map, period, index) => {
  map[period] = index;
  return map;
}, {});
export const PERIOD_MIN_MAP: Record<string, { start: number; end: number }> = {
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

export const normalizeCourseSchedule = (schedule: CourseScheduleModel): CourseTimeslot | null => {
  if (!Number.isInteger(schedule.day) || schedule.day < 1 || schedule.day > 7) return null;
  if (!Number.isInteger(schedule.span) || schedule.span < 1) return null;

  const startIndex = PERIOD_INDEX_MAP[schedule.start_period];
  if (typeof startIndex !== "number") return null;

  const endIndex = startIndex + schedule.span - 1;
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

export const normalizeCourseSchedules = (schedules: CourseScheduleModel[]): CourseTimeslot[] => {
  return schedules
    .map(normalizeCourseSchedule)
    .filter((timeslot): timeslot is CourseTimeslot => timeslot !== null);
};

export const isEwantDepartment = (department: string): boolean => department === EWANT_DEPARTMENT;

export const hasTimeslotOverlap = (a: CourseTimeslot, b: CourseTimeslot): boolean => {
  return a.dayOfWeek === b.dayOfWeek && a.startMin < b.endMin && b.startMin < a.endMin;
};

export const buildTimetableConflict = (
  courseId: number,
  conflictWithCourseId: number,
  a: CourseTimeslot,
  b: CourseTimeslot
): TimetableConflict => {
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
