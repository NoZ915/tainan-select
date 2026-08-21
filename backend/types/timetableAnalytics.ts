export const TIMETABLE_ANALYTICS_CONFIG = {
  maxSemestersPerSnapshot: 10,
  maxCoursesPerSemester: 100,
  guestSnapshotTtlDays: 180,
} as const;

export type GuestSnapshotSemesters = Record<string, number[]>;

export type GuestSnapshotSyncInput = {
  clientId: string;
  semesters: GuestSnapshotSemesters;
};
