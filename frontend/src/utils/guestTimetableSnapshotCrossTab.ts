import type { GuestTimetableSnapshotPayload } from '../apis/guestTimetableSnapshotAPI'

export const GUEST_TIMETABLE_SNAPSHOT_SYNC_DISABLED_STORAGE_KEY =
  'tainan-select:guest-timetable-snapshot-sync-disabled:v1'

type LockManager = {
  request: <Result>(
    name: string,
    callback: () => Result | PromiseLike<Result>,
  ) => Promise<Result>
}

const getLockManager = (): LockManager | null => {
  if (typeof navigator === 'undefined' || !navigator.locks) return null
  return navigator.locks
}

export const withGuestTimetableSnapshotLock = async <Result>(
  lockKey: string,
  callback: () => Result | PromiseLike<Result>,
  lockManager: LockManager | null = getLockManager(),
): Promise<Result> => {
  if (!lockManager) return callback()
  return lockManager.request(`tainan-select:guest-timetable-snapshot:${lockKey}`, callback)
}

export const setGuestTimetableSnapshotSyncDisabled = (
  clientId: string,
  disabled: boolean,
  storage: Storage = window.localStorage,
): void => {
  if (disabled) {
    storage.setItem(GUEST_TIMETABLE_SNAPSHOT_SYNC_DISABLED_STORAGE_KEY, clientId)
    return
  }

  if (storage.getItem(GUEST_TIMETABLE_SNAPSHOT_SYNC_DISABLED_STORAGE_KEY) === clientId) {
    storage.removeItem(GUEST_TIMETABLE_SNAPSHOT_SYNC_DISABLED_STORAGE_KEY)
  }
}

export const isGuestTimetableSnapshotSyncDisabled = (
  payload: GuestTimetableSnapshotPayload,
  storage: Storage = window.localStorage,
): boolean => storage.getItem(GUEST_TIMETABLE_SNAPSHOT_SYNC_DISABLED_STORAGE_KEY) === payload.clientId
