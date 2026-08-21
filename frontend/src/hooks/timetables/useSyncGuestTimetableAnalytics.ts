import { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { guestTimetableAnalyticsSyncCoordinator } from '../../utils/guestTimetableAnalyticsSync'
import { useGuestTimetable } from './useGuestTimetable'

export const useSyncGuestTimetableAnalytics = (): void => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const { storage, error } = useGuestTimetable()

  useEffect(() => {
    guestTimetableAnalyticsSyncCoordinator.setAuthState(
      isAuthResolved,
      isAuthenticated,
    )

    if (isAuthResolved && !isAuthenticated && error === null) {
      guestTimetableAnalyticsSyncCoordinator.schedule(storage)
    }
  }, [error, isAuthResolved, isAuthenticated, storage])
}
