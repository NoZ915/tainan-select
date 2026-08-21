import {
  deleteGuestTimetableSnapshot,
  syncGuestTimetableSnapshot,
} from '../apis/timetableAnalyticsAPI'
import { getOrCreateAnalyticsClientId } from './analyticsClientId'
import {
  GuestTimetableAnalyticsSyncCoordinator,
} from './guestTimetableAnalyticsSyncCoordinator'

const guestTimetableAnalyticsSyncCoordinator = new GuestTimetableAnalyticsSyncCoordinator({
  getClientId: getOrCreateAnalyticsClientId,
  syncSnapshot: syncGuestTimetableSnapshot,
  deleteSnapshot: deleteGuestTimetableSnapshot,
  setTimer: (callback, delay) => window.setTimeout(callback, delay),
  clearTimer: (timerId) => window.clearTimeout(timerId),
  logError: (message, error) => console.error(message, error),
})

export { guestTimetableAnalyticsSyncCoordinator }

export const deleteGuestSnapshotAfterSuccessfulImport = (): Promise<void> => (
  guestTimetableAnalyticsSyncCoordinator.deleteAfterSuccessfulImport()
)
