import type {
  TimetableConflict,
  TimetableCourse,
  TimetableGrid,
  TimetableItem,
  Timeslot,
} from '../types/timetableType'

export const EWANT_DEPARTMENT = '校外遠距(EWANT)'

export const TIMETABLE_PERIOD_ORDER = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
] as const

export type TimetablePeriod = (typeof TIMETABLE_PERIOD_ORDER)[number]

export type OccupiedPeriod = {
  dayOfWeek: number
  period: TimetablePeriod
}

export const TIMETABLE_PERIOD_TIME_RANGES: Record<
  TimetablePeriod,
  { startMin: number; endMin: number }
> = {
  '1': { startMin: 430, endMin: 480 },
  '2': { startMin: 480, endMin: 530 },
  '3': { startMin: 540, endMin: 590 },
  '4': { startMin: 600, endMin: 650 },
  '5': { startMin: 660, endMin: 710 },
  '6': { startMin: 720, endMin: 770 },
  '7': { startMin: 780, endMin: 830 },
  '8': { startMin: 840, endMin: 890 },
  '9': { startMin: 900, endMin: 950 },
  A: { startMin: 960, endMin: 1010 },
  B: { startMin: 1020, endMin: 1070 },
  C: { startMin: 1110, endMin: 1160 },
  D: { startMin: 1160, endMin: 1210 },
  E: { startMin: 1210, endMin: 1260 },
  F: { startMin: 1260, endMin: 1310 },
  G: { startMin: 1310, endMin: 1360 },
}

const timetablePeriodSet = new Set<string>(TIMETABLE_PERIOD_ORDER)
const timetablePeriodIndexMap = new Map<string, number>(
  TIMETABLE_PERIOD_ORDER.map((period, index) => [period, index]),
)

export const isTimetablePeriod = (value: unknown): value is TimetablePeriod =>
  typeof value === 'string' && timetablePeriodSet.has(value)

export const isValidDayOfWeek = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 7

export const getPeriodsInRange = (
  startPeriod: string,
  endPeriod: string,
): TimetablePeriod[] => {
  const startIndex = timetablePeriodIndexMap.get(startPeriod)
  const endIndex = timetablePeriodIndexMap.get(endPeriod)

  if (startIndex === undefined || endIndex === undefined || endIndex < startIndex) {
    return []
  }

  return TIMETABLE_PERIOD_ORDER.slice(startIndex, endIndex + 1)
}

export const getOccupiedPeriods = (
  item: Pick<TimetableItem, 'timeslots'>,
): OccupiedPeriod[] => {
  const occupiedPeriods: OccupiedPeriod[] = []
  const occupiedPeriodKeys = new Set<string>()

  item.timeslots.forEach((timeslot) => {
    if (!isValidDayOfWeek(timeslot.dayOfWeek)) return

    getPeriodsInRange(timeslot.startPeriod, timeslot.endPeriod).forEach((period) => {
      const key = `${timeslot.dayOfWeek}:${period}`
      if (occupiedPeriodKeys.has(key)) return

      occupiedPeriodKeys.add(key)
      occupiedPeriods.push({ dayOfWeek: timeslot.dayOfWeek, period })
    })
  })

  return occupiedPeriods
}

export const isEwantCourse = (
  course: Pick<TimetableCourse, 'department'>,
): boolean => course.department === EWANT_DEPARTMENT

export const buildTimetableGrid = (
  items: readonly TimetableItem[],
): TimetableGrid => {
  const grid = Object.fromEntries(
    TIMETABLE_PERIOD_ORDER.map((period) => [period, {}]),
  ) as TimetableGrid

  items.forEach((item) => {
    if (isEwantCourse(item.course)) return

    getOccupiedPeriods(item).forEach(({ dayOfWeek, period }) => {
      const currentCourses = grid[period][dayOfWeek] ?? []
      currentCourses.push({
        courseId: item.course.id,
        courseName: item.course.name,
        instructor: item.course.instructor,
        room: item.course.room,
      })
      grid[period][dayOfWeek] = currentCourses
    })
  })

  return grid
}

export const hasTimeslotOverlap = (first: Timeslot, second: Timeslot): boolean =>
  first.dayOfWeek === second.dayOfWeek
  && first.startMin < second.endMin
  && second.startMin < first.endMin

const buildTimetableConflict = (
  courseId: number,
  conflictWithCourseId: number,
  candidateTimeslot: Timeslot,
  existingTimeslot: Timeslot,
): TimetableConflict => {
  const overlapStart = Math.max(candidateTimeslot.startMin, existingTimeslot.startMin)
  const overlapEnd = Math.min(candidateTimeslot.endMin, existingTimeslot.endMin)
  const overlapStartPeriod = candidateTimeslot.startMin >= existingTimeslot.startMin
    ? candidateTimeslot.startPeriod
    : existingTimeslot.startPeriod
  const overlapEndPeriod = candidateTimeslot.endMin <= existingTimeslot.endMin
    ? candidateTimeslot.endPeriod
    : existingTimeslot.endPeriod

  return {
    courseId,
    conflictWithCourseId,
    dayOfWeek: candidateTimeslot.dayOfWeek,
    overlap: {
      startMin: overlapStart,
      endMin: overlapEnd,
      startPeriod: overlapStartPeriod,
      endPeriod: overlapEndPeriod,
    },
  }
}

export const findTimetableConflicts = (
  candidate: TimetableItem,
  existingItems: readonly TimetableItem[],
): TimetableConflict[] => {
  if (isEwantCourse(candidate.course) || candidate.timeslots.length === 0) {
    return []
  }

  const conflicts: TimetableConflict[] = []

  existingItems.forEach((existingItem) => {
    if (
      existingItem.course.id === candidate.course.id
      || existingItem.course.semester !== candidate.course.semester
      || isEwantCourse(existingItem.course)
      || existingItem.timeslots.length === 0
    ) {
      return
    }

    candidate.timeslots.forEach((candidateTimeslot) => {
      existingItem.timeslots.forEach((existingTimeslot) => {
        if (!hasTimeslotOverlap(candidateTimeslot, existingTimeslot)) return

        conflicts.push(buildTimetableConflict(
          candidate.course.id,
          existingItem.course.id,
          candidateTimeslot,
          existingTimeslot,
        ))
      })
    })
  })

  return conflicts
}

export const getConflictCourseIds = (
  conflicts: readonly TimetableConflict[],
): number[] => Array.from(new Set(conflicts.map((conflict) => conflict.conflictWithCourseId)))

export const findConflictCourseIds = (
  candidate: TimetableItem,
  existingItems: readonly TimetableItem[],
): number[] => getConflictCourseIds(findTimetableConflicts(candidate, existingItems))

export const getMissingTimeslotItems = <T extends TimetableItem>(
  items: readonly T[],
): T[] => items.filter(
  (item) => !isEwantCourse(item.course) && item.timeslots.length === 0,
)

export const countMissingTimeslotCourses = (
  items: readonly TimetableItem[],
): number => getMissingTimeslotItems(items).length

export const hasWeekendCourses = (
  items: readonly TimetableItem[],
): boolean => items.some(
  (item) => !isEwantCourse(item.course)
    && item.timeslots.some((timeslot) => timeslot.dayOfWeek === 6 || timeslot.dayOfWeek === 7),
)
