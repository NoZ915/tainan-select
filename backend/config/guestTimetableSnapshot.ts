export const GUEST_TIMETABLE_SNAPSHOT_CONFIG = {
  maxSemestersPerSnapshot: 10,
  maxCoursesPerSemester: 100,
  guestSnapshotTtlDays: 180,
  rateLimitWindowMs: 60 * 1000,
  rateLimitMaxRequests: 30,
  rateLimitMaxSources: 10_000,
} as const;
