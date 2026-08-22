export type GuestTimetableSnapshotSemesters = Record<string, number[]>;

export type GuestTimetableSnapshotSyncInput = {
  clientId: string;
  semesters: GuestTimetableSnapshotSemesters;
};
