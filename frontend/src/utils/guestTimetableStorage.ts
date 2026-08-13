import type {
  GuestTimetableItem,
  GuestTimetableStorage,
  Timeslot,
} from '../types/timetableType'
import {
  getPeriodsInRange,
  isTimetablePeriod,
  isValidDayOfWeek,
  TIMETABLE_PERIOD_TIME_RANGES,
} from './timetable'

export const GUEST_TIMETABLE_STORAGE_KEY = 'tainan-select:guest-timetable:v1'
export const GUEST_TIMETABLE_STORAGE_VERSION = 1 as const
export const GUEST_TIMETABLE_CHANGE_EVENT = 'tainan-select:guest-timetable:change'

export type GuestTimetableStorageErrorCode =
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'REMOVE_FAILED'
  | 'INVALID_ITEM'
  | 'CONFLICTS_CHANGED'

export class GuestTimetableStorageError extends Error {
  readonly code: GuestTimetableStorageErrorCode
  readonly originalError?: unknown

  constructor(
    code: GuestTimetableStorageErrorCode,
    message: string,
    originalError?: unknown,
  ) {
    super(message)
    this.name = 'GuestTimetableStorageError'
    this.code = code
    this.originalError = originalError
  }
}

export type GuestTimetableSummary = {
  totalCourses: number
  semesterCount: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isString = (value: unknown): value is string => typeof value === 'string'

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string'

const isValidIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))

const isValidCourseId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0

export const createEmptyGuestTimetableStorage = (): GuestTimetableStorage => ({
  version: GUEST_TIMETABLE_STORAGE_VERSION,
  semesters: {},
})

export const isGuestTimetableTimeslot = (value: unknown): value is Timeslot => {
  if (!isRecord(value)) return false

  const startPeriod = isTimetablePeriod(value.startPeriod) ? value.startPeriod : null
  const endPeriod = isTimetablePeriod(value.endPeriod) ? value.endPeriod : null
  if (!startPeriod || !endPeriod) return false

  return isValidDayOfWeek(value.dayOfWeek)
    && getPeriodsInRange(startPeriod, endPeriod).length > 0
    && Number.isInteger(value.startMin)
    && Number.isInteger(value.endMin)
    && value.startMin === TIMETABLE_PERIOD_TIME_RANGES[startPeriod].startMin
    && value.endMin === TIMETABLE_PERIOD_TIME_RANGES[endPeriod].endMin
}

export const isGuestTimetableItem = (value: unknown): value is GuestTimetableItem => {
  if (!isRecord(value) || !isRecord(value.course) || !Array.isArray(value.timeslots)) {
    return false
  }

  const course = value.course

  return isValidCourseId(course.id)
    && isNonEmptyString(course.name)
    && isNonEmptyString(course.semester)
    && isString(course.department)
    && isString(course.instructor)
    && isOptionalString(course.room)
    && isOptionalString(course.courseTime)
    && value.timeslots.every(isGuestTimetableTimeslot)
    && isValidIsoDate(value.addedAt)
}

export const isGuestTimetableStorage = (value: unknown): value is GuestTimetableStorage => {
  if (
    !isRecord(value)
    || value.version !== GUEST_TIMETABLE_STORAGE_VERSION
    || !isRecord(value.semesters)
  ) {
    return false
  }

  return Object.entries(value.semesters).every(([semester, items]) =>
    isNonEmptyString(semester)
    && Array.isArray(items)
    && items.every(
      (item) => isGuestTimetableItem(item) && item.course.semester === semester,
    ))
}

const normalizeGuestTimetableStorage = (
  storage: GuestTimetableStorage,
): GuestTimetableStorage => ({
  version: GUEST_TIMETABLE_STORAGE_VERSION,
  semesters: Object.fromEntries(
    Object.entries(storage.semesters).map(([semester, items]) => {
      const seenCourseIds = new Set<number>()
      const deduplicatedItems = items.filter((item) => {
        if (seenCourseIds.has(item.course.id)) return false
        seenCourseIds.add(item.course.id)
        return true
      })
      return [semester, deduplicatedItems]
    }),
  ),
})

export const parseGuestTimetableStorage = (
  rawValue: string | null,
): GuestTimetableStorage => {
  if (!rawValue) return createEmptyGuestTimetableStorage()

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    if (!isGuestTimetableStorage(parsedValue)) {
      return createEmptyGuestTimetableStorage()
    }
    return normalizeGuestTimetableStorage(parsedValue)
  } catch {
    return createEmptyGuestTimetableStorage()
  }
}

export const readGuestTimetableRawValue = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(GUEST_TIMETABLE_STORAGE_KEY)
  } catch (error) {
    throw new GuestTimetableStorageError(
      'READ_FAILED',
      '無法讀取本機課表，請確認瀏覽器是否允許使用本機儲存空間。',
      error,
    )
  }
}

export const getGuestTimetable = (): GuestTimetableStorage =>
  parseGuestTimetableStorage(readGuestTimetableRawValue())

export const getGuestItemsBySemester = (
  semester: string,
): GuestTimetableItem[] => getGuestTimetable().semesters[semester] ?? []

export const isGuestCourseAdded = (
  semester: string,
  courseId: number,
): boolean => getGuestItemsBySemester(semester).some((item) => item.course.id === courseId)

export const getGuestTimetableSummary = (
  storage: GuestTimetableStorage = getGuestTimetable(),
): GuestTimetableSummary => {
  const nonEmptySemesters = Object.values(storage.semesters).filter((items) => items.length > 0)

  return {
    totalCourses: nonEmptySemesters.reduce((total, items) => total + items.length, 0),
    semesterCount: nonEmptySemesters.length,
  }
}

export const subscribeGuestTimetable = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined

  const handleSameTabChange = (): void => listener()
  const handleStorageChange = (event: StorageEvent): void => {
    if (event.key === GUEST_TIMETABLE_STORAGE_KEY || event.key === null) {
      listener()
    }
  }

  window.addEventListener(GUEST_TIMETABLE_CHANGE_EVENT, handleSameTabChange)
  window.addEventListener('storage', handleStorageChange)

  return () => {
    window.removeEventListener(GUEST_TIMETABLE_CHANGE_EVENT, handleSameTabChange)
    window.removeEventListener('storage', handleStorageChange)
  }
}
