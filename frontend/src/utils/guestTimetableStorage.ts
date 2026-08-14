import type {
  GuestTimetableItem,
  GuestTimetableStorage,
  Timeslot,
} from '../types/timetableType'
import {
  findConflictCourseIds,
  getPeriodsInRange,
  isTimetablePeriod,
  isValidDayOfWeek,
  TIMETABLE_PERIOD_TIME_RANGES,
} from './timetable'

export const GUEST_TIMETABLE_STORAGE_KEY = 'tainan-select:guest-timetable:v1'
export const GUEST_TIMETABLE_STORAGE_VERSION = 1 as const
export const GUEST_TIMETABLE_CHANGE_EVENT = 'tainan-select:guest-timetable:change'
const GUEST_TIMETABLE_WRITE_LOCK = 'tainan-select:guest-timetable:write'

let guestTimetableWriteQueue: Promise<void> = Promise.resolve()

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

export type AddGuestCourseResult = {
  added: boolean
  alreadyExists: boolean
  conflictCourseIds: number[]
}

export type SwapGuestCourseResult = AddGuestCourseResult & {
  removedCourseIds: number[]
}

export type GuestTimetableSummary = {
  totalCourses: number
  semesterCount: number
}

export type GuestTimetableClearResult = 'cleared' | 'already-empty' | 'changed'

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

const haveSameGuestTimetableCourses = (
  firstStorage: GuestTimetableStorage,
  secondStorage: GuestTimetableStorage,
): boolean => {
  const firstSemesters = Object.entries(firstStorage.semesters)
    .filter(([, items]) => items.length > 0)
  const secondSemesters = Object.entries(secondStorage.semesters)
    .filter(([, items]) => items.length > 0)

  if (firstSemesters.length !== secondSemesters.length) return false

  return firstSemesters.every(([semester, firstItems]) => {
    const secondItems = secondStorage.semesters[semester]
    if (!secondItems || firstItems.length !== secondItems.length) return false

    const secondCourseIds = new Set(secondItems.map((item) => item.course.id))
    return firstItems.every((item) => secondCourseIds.has(item.course.id))
  })
}

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

const dispatchGuestTimetableChange = (): void => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(GUEST_TIMETABLE_CHANGE_EVENT))
}

const writeGuestTimetable = (storage: GuestTimetableStorage): void => {
  if (typeof window === 'undefined') {
    throw new GuestTimetableStorageError(
      'WRITE_FAILED',
      '目前環境無法保存本機課表。',
    )
  }

  try {
    window.localStorage.setItem(GUEST_TIMETABLE_STORAGE_KEY, JSON.stringify(storage))
  } catch (error) {
    throw new GuestTimetableStorageError(
      'WRITE_FAILED',
      '無法保存本機課表，請確認瀏覽器是否允許使用本機儲存空間。',
      error,
    )
  }

  dispatchGuestTimetableChange()
}

const assertValidGuestTimetableItem = (item: GuestTimetableItem): void => {
  if (isGuestTimetableItem(item)) return

  throw new GuestTimetableStorageError(
    'INVALID_ITEM',
    '課程資料格式不正確，無法加入本機課表。',
  )
}

const withGuestTimetableWriteLock = async <Result>(
  mutation: () => Result,
): Promise<Result> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(GUEST_TIMETABLE_WRITE_LOCK, mutation)
  }

  // 不支援 Web Locks 的瀏覽器至少要避免同一分頁內的寫入互相覆蓋。
  const queuedMutation = guestTimetableWriteQueue.then(mutation, mutation)
  guestTimetableWriteQueue = queuedMutation.then(() => undefined, () => undefined)
  return queuedMutation
}

export const addGuestCourse = (
  item: GuestTimetableItem,
): Promise<AddGuestCourseResult> => {
  assertValidGuestTimetableItem(item)

  return withGuestTimetableWriteLock(() => {
    const storage = getGuestTimetable()
    const semester = item.course.semester
    const currentItems = storage.semesters[semester] ?? []
    const alreadyExists = currentItems.some(
      (currentItem) => currentItem.course.id === item.course.id,
    )

    if (alreadyExists) {
      return { added: false, alreadyExists: true, conflictCourseIds: [] }
    }

    const conflictCourseIds = findConflictCourseIds(item, currentItems)
    if (conflictCourseIds.length > 0) {
      return {
        added: false,
        alreadyExists: false,
        conflictCourseIds,
      }
    }

    writeGuestTimetable({
      ...storage,
      semesters: {
        ...storage.semesters,
        [semester]: [...currentItems, item],
      },
    })

    return { added: true, alreadyExists: false, conflictCourseIds: [] }
  })
}

export const removeGuestCourse = (
  semester: string,
  courseId: number,
  canRemove?: () => boolean,
): Promise<boolean> => withGuestTimetableWriteLock(() => {
  if (canRemove && !canRemove()) return false

  const storage = getGuestTimetable()
  const currentItems = storage.semesters[semester] ?? []
  const nextItems = currentItems.filter((item) => item.course.id !== courseId)

  if (nextItems.length === currentItems.length) return false

  const nextSemesters = { ...storage.semesters }
  if (nextItems.length === 0) {
    delete nextSemesters[semester]
  } else {
    nextSemesters[semester] = nextItems
  }

  writeGuestTimetable({ ...storage, semesters: nextSemesters })

  return true
})

export const clearGuestSemester = (
  semester: string,
  expectedCourseIds: readonly number[],
): Promise<GuestTimetableClearResult> => withGuestTimetableWriteLock(() => {
  const storage = getGuestTimetable()
  const currentItems = storage.semesters[semester]
  if (!currentItems || currentItems.length === 0) return 'already-empty'

  const expectedCourseIdSet = new Set(expectedCourseIds)
  const snapshotMatches = currentItems.length === expectedCourseIdSet.size
    && currentItems.every((item) => expectedCourseIdSet.has(item.course.id))
  if (!snapshotMatches) return 'changed'

  const nextSemesters = { ...storage.semesters }
  delete nextSemesters[semester]
  writeGuestTimetable({ ...storage, semesters: nextSemesters })
  return 'cleared'
})

export const clearGuestTimetable = (
  expectedStorage: GuestTimetableStorage,
): Promise<GuestTimetableClearResult> => withGuestTimetableWriteLock(() => {
  if (typeof window === 'undefined') {
    throw new GuestTimetableStorageError(
      'REMOVE_FAILED',
      '目前環境無法清除本機課表。',
    )
  }

  const currentStorage = getGuestTimetable()
  const hasCurrentCourses = Object.values(currentStorage.semesters)
    .some((items) => items.length > 0)
  if (!hasCurrentCourses) return 'already-empty'

  if (!haveSameGuestTimetableCourses(expectedStorage, currentStorage)) {
    return 'changed'
  }

  try {
    window.localStorage.removeItem(GUEST_TIMETABLE_STORAGE_KEY)
  } catch (error) {
    throw new GuestTimetableStorageError(
      'REMOVE_FAILED',
      '無法清除本機課表，請確認瀏覽器是否允許使用本機儲存空間。',
      error,
    )
  }

  dispatchGuestTimetableChange()
  return 'cleared'
})

export const swapGuestCourse = (
  item: GuestTimetableItem,
  conflictCourseIds: readonly number[],
): Promise<SwapGuestCourseResult> => {
  assertValidGuestTimetableItem(item)

  return withGuestTimetableWriteLock(() => {
    const storage = getGuestTimetable()
    const semester = item.course.semester
    const currentItems = storage.semesters[semester] ?? []
    const alreadyExists = currentItems.some(
      (currentItem) => currentItem.course.id === item.course.id,
    )

    if (alreadyExists) {
      return {
        added: false,
        alreadyExists: true,
        conflictCourseIds: [],
        removedCourseIds: [],
      }
    }

    const latestConflictCourseIds = findConflictCourseIds(item, currentItems)
    const latestConflictCourseIdSet = new Set(latestConflictCourseIds)
    const confirmedConflictCourseIdSet = new Set(
      conflictCourseIds.filter((courseId) => courseId !== item.course.id),
    )
    const conflictsChanged = latestConflictCourseIdSet.size !== confirmedConflictCourseIdSet.size
      || [...latestConflictCourseIdSet].some(
        (courseId) => !confirmedConflictCourseIdSet.has(courseId),
      )

    if (conflictsChanged) {
      throw new GuestTimetableStorageError(
        'CONFLICTS_CHANGED',
        '本機課表已在其他分頁變更，請重新確認衝堂課程。',
      )
    }

    const conflictCourseIdSet = latestConflictCourseIdSet
    const removedCourseIds = Array.from(new Set(
      currentItems
        .filter((currentItem) => conflictCourseIdSet.has(currentItem.course.id))
        .map((currentItem) => currentItem.course.id),
    ))
    const nextItems = currentItems.filter(
      (currentItem) => !conflictCourseIdSet.has(currentItem.course.id),
    )

    writeGuestTimetable({
      ...storage,
      semesters: {
        ...storage.semesters,
        [semester]: [...nextItems, item],
      },
    })

    return {
      added: true,
      alreadyExists: false,
      conflictCourseIds: [],
      removedCourseIds,
    }
  })
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
