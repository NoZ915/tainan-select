import assert from "node:assert/strict";
import test from "node:test";
import GuestTimetableSnapshotModel from "./GuestTimetableSnapshot";

test("GuestTimetableSnapshots model 使用單表 JSON snapshot 與必要索引", () => {
  assert.equal(GuestTimetableSnapshotModel.tableName, "GuestTimetableSnapshots");
  assert.equal(
    (GuestTimetableSnapshotModel.rawAttributes.course_ids.type as { key?: string }).key,
    "JSON"
  );

  const indexes = GuestTimetableSnapshotModel.options.indexes ?? [];
  assert.ok(indexes.some((index) => (
    index.name === "uniq_guest_timetable_snapshots_client_semester"
      && index.unique === true
  )));
  assert.ok(indexes.some((index) => (
    index.name === "idx_guest_timetable_snapshots_semester_synced_at"
  )));
});
