import { axiosInstance } from './axiosInstance'

export type GuestTimetableSnapshotPayload = {
  clientId: string
  semesters: Record<string, number[]>
}

export const syncGuestTimetableSnapshot = async (
  payload: GuestTimetableSnapshotPayload,
): Promise<void> => {
  await axiosInstance.put('/timetable-analytics/guest-snapshot', payload)
}

export const deleteGuestTimetableSnapshot = async (clientId: string): Promise<void> => {
  await axiosInstance.delete('/timetable-analytics/guest-snapshot', {
    data: { clientId },
  })
}
