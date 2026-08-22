import {
  deleteGuestTimetableSnapshot,
  syncGuestTimetableSnapshot,
} from '../apis/guestTimetableSnapshotAPI'
import { getOrCreateAnalyticsClientId } from './analyticsClientId'
import {
  GuestTimetableSnapshotSyncCoordinator,
} from './guestTimetableSnapshotSyncCoordinator'

const guestTimetableSnapshotSyncCoordinator = new GuestTimetableSnapshotSyncCoordinator({
  getClientId: getOrCreateAnalyticsClientId,
  syncSnapshot: syncGuestTimetableSnapshot,
  deleteSnapshot: deleteGuestTimetableSnapshot,
  setTimer: (callback, delay) => window.setTimeout(callback, delay),
  clearTimer: (timerId) => window.clearTimeout(timerId),
  logError: (message, error) => console.error(message, error),
})

export { guestTimetableSnapshotSyncCoordinator }

export const deleteSyncedGuestTimetableSnapshot = (): Promise<void> => (
  guestTimetableSnapshotSyncCoordinator.deleteSnapshot()
)
