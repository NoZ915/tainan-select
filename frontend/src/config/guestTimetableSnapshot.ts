export const GUEST_TIMETABLE_SNAPSHOT_CONFIG = {
  maxSemestersPerSnapshot: 10,
  maxCoursesPerSemester: 100,
  syncDebounceMs: 400,
  retryInitialDelayMs: 1_000,
  retryMaxDelayMs: 30_000,
} as const
