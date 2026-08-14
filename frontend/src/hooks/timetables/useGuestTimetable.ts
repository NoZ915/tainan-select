import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type {
  GuestTimetableItem,
  GuestTimetableStorage,
} from '../../types/timetableType'
import {
  addGuestCourse,
  clearGuestSemester,
  clearGuestTimetable,
  createEmptyGuestTimetableStorage,
  getGuestTimetableSummary,
  GuestTimetableStorageError,
  isGuestCourseSnapshotCurrent,
  parseGuestTimetableStorage,
  readGuestTimetableRawValue,
  removeGuestCourse,
  removeGuestCourseSnapshot,
  subscribeGuestTimetable,
  swapGuestCourse,
} from '../../utils/guestTimetableStorage'
import type {
  AddGuestCourseResult,
  GuestTimetableClearResult,
  GuestTimetableSummary,
  SwapGuestCourseResult,
} from '../../utils/guestTimetableStorage'

const EMPTY_STORAGE_SNAPSHOT = ''
const READ_ERROR_STORAGE_SNAPSHOT = '\u0000guest-timetable-read-error'

const getStorageSnapshot = (): string => {
  try {
    return readGuestTimetableRawValue() ?? EMPTY_STORAGE_SNAPSHOT
  } catch {
    return READ_ERROR_STORAGE_SNAPSHOT
  }
}

const getServerStorageSnapshot = (): string => EMPTY_STORAGE_SNAPSHOT

export type UseGuestTimetableResult = {
  storage: GuestTimetableStorage
  semesters: string[]
  summary: GuestTimetableSummary
  error: GuestTimetableStorageError | null
  getItemsBySemester: (semester: string) => GuestTimetableItem[]
  isCourseAdded: (semester: string, courseId: number) => boolean
  isCourseSnapshotCurrent: (item: GuestTimetableItem) => Promise<boolean>
  addCourse: (item: GuestTimetableItem) => Promise<AddGuestCourseResult>
  removeCourse: (
    semester: string,
    courseId: number,
    canRemove?: () => boolean,
  ) => Promise<boolean>
  removeCourseSnapshot: (
    item: GuestTimetableItem,
    canRemove?: () => boolean,
  ) => Promise<boolean>
  clearSemester: (
    semester: string,
    expectedItems: readonly GuestTimetableItem[],
  ) => Promise<GuestTimetableClearResult>
  clearAll: (expectedStorage: GuestTimetableStorage) => Promise<GuestTimetableClearResult>
  swapCourse: (
    item: GuestTimetableItem,
    conflictCourseIds: readonly number[],
  ) => Promise<SwapGuestCourseResult>
}

export const useGuestTimetable = (): UseGuestTimetableResult => {
  const rawSnapshot = useSyncExternalStore(
    subscribeGuestTimetable,
    getStorageSnapshot,
    getServerStorageSnapshot,
  )

  const { storage, error } = useMemo(() => {
    if (rawSnapshot === READ_ERROR_STORAGE_SNAPSHOT) {
      return {
        storage: createEmptyGuestTimetableStorage(),
        error: new GuestTimetableStorageError(
          'READ_FAILED',
          '無法讀取本機課表，請確認瀏覽器是否允許使用本機儲存空間。',
        ),
      }
    }

    try {
      return {
        storage: parseGuestTimetableStorage(rawSnapshot || null),
        error: null,
      }
    } catch (error) {
      return {
        storage: createEmptyGuestTimetableStorage(),
        error: error instanceof GuestTimetableStorageError
          ? error
          : new GuestTimetableStorageError(
            'PARSE_FAILED',
            '本機課表資料無法讀取，暫時無法修改，以免覆蓋其他學期的資料。',
            error,
          ),
      }
    }
  }, [rawSnapshot])

  const semesters = useMemo(
    () => Object.entries(storage.semesters)
      .filter(([, items]) => items.length > 0)
      .map(([semester]) => semester),
    [storage],
  )
  const summary = useMemo(() => getGuestTimetableSummary(storage), [storage])
  const getItemsBySemester = useCallback(
    (semester: string) => storage.semesters[semester] ?? [],
    [storage],
  )
  const isCourseAdded = useCallback(
    (semester: string, courseId: number) => getItemsBySemester(semester).some(
      (item) => item.course.id === courseId,
    ),
    [getItemsBySemester],
  )

  return {
    storage,
    semesters,
    summary,
    error,
    getItemsBySemester,
    isCourseAdded,
    isCourseSnapshotCurrent: isGuestCourseSnapshotCurrent,
    addCourse: addGuestCourse,
    removeCourse: removeGuestCourse,
    removeCourseSnapshot: removeGuestCourseSnapshot,
    clearSemester: clearGuestSemester,
    clearAll: clearGuestTimetable,
    swapCourse: swapGuestCourse,
  }
}
