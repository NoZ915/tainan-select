import assert from "node:assert/strict";
import test from "node:test";
import { Op, Transaction } from "sequelize";
import CourseModel from "../models/Course";
import GuestTimetableSnapshotModel from "../models/GuestTimetableSnapshot";
import TimetableAnalyticsRepository from "./timetableAnalyticsRepository";

const CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

test("findCoursesByIds 只查詢驗證需要的欄位", async (t) => {
  const transaction = {} as Transaction;
  const findAllMock = t.mock.method(CourseModel, "findAll", async () => []);

  await TimetableAnalyticsRepository.findCoursesByIds([1, 2], transaction);

  const options = findAllMock.mock.calls[0].arguments[0];
  assert.deepEqual(options?.attributes, ["id", "semester"]);
  assert.deepEqual((options?.where as { id: { [Op.in]: number[] } }).id[Op.in], [1, 2]);
  assert.equal(options?.transaction, transaction);
  assert.equal(options?.raw, true);
});

test("upsertSnapshot 以 client 與學期完整覆寫 course_ids", async (t) => {
  const transaction = {} as Transaction;
  const lastSyncedAt = new Date();
  const upsertMock = t.mock.method(GuestTimetableSnapshotModel, "upsert", async () => [
    {} as GuestTimetableSnapshotModel,
    false,
  ] as [GuestTimetableSnapshotModel, boolean | null]);

  await TimetableAnalyticsRepository.upsertSnapshot(
    CLIENT_ID,
    "115-1",
    [1, 2],
    lastSyncedAt,
    transaction
  );

  assert.deepEqual(upsertMock.mock.calls[0].arguments, [
    {
      client_id: CLIENT_ID,
      semester: "115-1",
      course_ids: [1, 2],
      last_synced_at: lastSyncedAt,
    },
    { transaction },
  ]);
});

test("deleteMissingSemesters 保留 payload 仍存在的學期", async (t) => {
  const transaction = {} as Transaction;
  const destroyMock = t.mock.method(GuestTimetableSnapshotModel, "destroy", async () => 1);

  await TimetableAnalyticsRepository.deleteMissingSemesters(
    CLIENT_ID,
    ["115-1"],
    transaction
  );

  const options = destroyMock.mock.calls[0].arguments[0];
  const where = options?.where as {
    client_id: string;
    semester: { [Op.notIn]: string[] };
  };
  assert.equal(where.client_id, CLIENT_ID);
  assert.deepEqual(
    where.semester[Op.notIn],
    ["115-1"]
  );
  assert.equal(options?.transaction, transaction);
});
