export const GUEST_TIMETABLE_SNAPSHOT_CONFIG = {
  maxSemestersPerSnapshot: 10,
  maxCoursesPerSemester: 100,
  guestSnapshotTtlDays: 180,
} as const;

export type GuestTimetableSnapshotSemesters = Record<string, number[]>;

export type GuestTimetableSnapshotSyncInput = {
  clientId: string;
  semesters: GuestTimetableSnapshotSemesters;
};
