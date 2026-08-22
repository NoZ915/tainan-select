import { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { guestTimetableSnapshotSyncCoordinator } from '../../utils/guestTimetableSnapshotSync'
import { useGuestTimetable } from './useGuestTimetable'

export const useSyncGuestTimetableSnapshot = (): void => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const { storage, error } = useGuestTimetable()

  useEffect(() => {
    guestTimetableSnapshotSyncCoordinator.setAuthState(
      isAuthResolved,
      isAuthenticated,
    )

    if (isAuthResolved && !isAuthenticated && error === null) {
      guestTimetableSnapshotSyncCoordinator.schedule(storage)
    }
  }, [error, isAuthResolved, isAuthenticated, storage])
}
