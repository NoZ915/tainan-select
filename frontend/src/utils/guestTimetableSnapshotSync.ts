import {
  deleteGuestTimetableSnapshot,
  syncGuestTimetableSnapshot,
} from '../apis/guestTimetableSnapshotAPI'
import { getOrCreateAnalyticsClientId } from './analyticsClientId'
import {
  GuestTimetableSnapshotSyncCoordinator,
} from './guestTimetableSnapshotSyncCoordinator'
import {
  isGuestTimetableSnapshotSyncDisabled,
  setGuestTimetableSnapshotSyncDisabled,
  withGuestTimetableSnapshotLock,
} from './guestTimetableSnapshotCrossTab'

const guestTimetableSnapshotSyncCoordinator = new GuestTimetableSnapshotSyncCoordinator({
  getClientId: getOrCreateAnalyticsClientId,
  syncSnapshot: (payload) => withGuestTimetableSnapshotLock(payload.clientId, async () => {
    if (isGuestTimetableSnapshotSyncDisabled(payload)) return
    await syncGuestTimetableSnapshot(payload)
  }),
  deleteSnapshot: (clientId) => withGuestTimetableSnapshotLock(
    clientId,
    () => deleteGuestTimetableSnapshot(clientId),
  ),
  setSyncDisabled: setGuestTimetableSnapshotSyncDisabled,
  setTimer: (callback, delay) => window.setTimeout(callback, delay),
  clearTimer: (timerId) => window.clearTimeout(timerId),
  logError: (message, error) => console.error(message, error),
})

export { guestTimetableSnapshotSyncCoordinator }

export const deleteSyncedGuestTimetableSnapshot = (): Promise<void> => (
  guestTimetableSnapshotSyncCoordinator.deleteSnapshot()
)
