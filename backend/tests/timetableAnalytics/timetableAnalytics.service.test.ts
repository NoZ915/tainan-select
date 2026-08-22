import assert from "node:assert/strict";
import test from "node:test";
import { Transaction } from "sequelize";
import db from "../../models";
import TimetableAnalyticsRepository from "../../repositories/timetableAnalyticsRepository";
import {
  normalizeGuestSnapshotInput,
  TimetableAnalyticsServiceError,
} from "../../services/timetableAnalyticsService";
import TimetableAnalyticsService from "../../services/timetableAnalyticsService";

const CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

test("同步輸入會將 course ID 去重並正規化 client ID", () => {
  assert.deepEqual(
    normalizeGuestSnapshotInput({
      clientId: CLIENT_ID.toUpperCase(),
      semesters: { "115-1": [3, 1, 3] },
    }),
    {
      clientId: CLIENT_ID,
      semesters: { "115-1": [3, 1] },
    }
  );
});

test("同步輸入會拒絕無效的 UUID、學期與 course ID", () => {
  const invalidInputs = [
    { clientId: "invalid", semesters: {} },
    { clientId: CLIENT_ID, semesters: { "115-3": [] } },
    { clientId: CLIENT_ID, semesters: { "115-1": [0] } },
    { clientId: CLIENT_ID, semesters: { "115-1": [1.5] } },
  ];

  invalidInputs.forEach((input) => {
    assert.throws(
      () => normalizeGuestSnapshotInput(input),
      (error) => error instanceof TimetableAnalyticsServiceError && error.status === 400
    );
  });
});

test("同步會在同一個 transaction 內驗證課程、upsert 並移除缺少的學期", async (t) => {
  const transaction = {} as Transaction;
  const upserts: Array<{ semester: string; courseIds: number[]; lastSyncedAt: Date }> = [];
  let deletedSemesters: string[] | undefined;

  t.mock.method(db.sequelize, "transaction", async (callback: (value: Transaction) => Promise<void>) => {
    await callback(transaction);
  });
  t.mock.method(TimetableAnalyticsRepository, "findCoursesByIds", async () => [
    { id: 1, semester: "115-1" },
    { id: 2, semester: "114-2" },
  ]);
  t.mock.method(
    TimetableAnalyticsRepository,
    "upsertSnapshot",
    async (
      _clientId: string,
      semester: string,
      courseIds: number[],
      lastSyncedAt: Date,
      receivedTransaction: Transaction
    ) => {
      assert.equal(receivedTransaction, transaction);
      upserts.push({ semester, courseIds, lastSyncedAt });
    }
  );
  t.mock.method(
    TimetableAnalyticsRepository,
    "deleteMissingSemesters",
    async (
      _clientId: string,
      activeSemesters: string[],
      receivedTransaction: Transaction
    ) => {
      assert.equal(receivedTransaction, transaction);
      deletedSemesters = activeSemesters;
      return 0;
    }
  );

  await TimetableAnalyticsService.syncGuestSnapshot({
    clientId: CLIENT_ID,
    semesters: {
      "115-1": [1, 1],
      "114-2": [2],
      "113-1": [],
    },
  });

  assert.deepEqual(
    upserts.map(({ semester, courseIds }) => ({ semester, courseIds })),
    [
      { semester: "115-1", courseIds: [1] },
      { semester: "114-2", courseIds: [2] },
    ]
  );
  assert.equal(upserts[0].lastSyncedAt, upserts[1].lastSyncedAt);
  assert.deepEqual(deletedSemesters, ["115-1", "114-2"]);
});

test("不存在或學期不一致的課程不會寫入 snapshot", async (t) => {
  const transaction = {} as Transaction;

  t.mock.method(db.sequelize, "transaction", async (callback: (value: Transaction) => Promise<void>) => {
    await callback(transaction);
  });
  t.mock.method(TimetableAnalyticsRepository, "findCoursesByIds", async () => [
    { id: 1, semester: "114-2" },
  ]);
  const upsertMock = t.mock.method(TimetableAnalyticsRepository, "upsertSnapshot", async () => {});
  const deleteMock = t.mock.method(
    TimetableAnalyticsRepository,
    "deleteMissingSemesters",
    async () => 0
  );

  await assert.rejects(
    TimetableAnalyticsService.syncGuestSnapshot({
      clientId: CLIENT_ID,
      semesters: { "115-1": [1, 2] },
    }),
    TimetableAnalyticsServiceError
  );
  assert.equal(upsertMock.mock.callCount(), 0);
  assert.equal(deleteMock.mock.callCount(), 0);
});

test("空課表 payload 會移除該 client 的所有有效 snapshot", async (t) => {
  const transaction = {} as Transaction;
  let activeSemesters: string[] | undefined;

  t.mock.method(db.sequelize, "transaction", async (callback: (value: Transaction) => Promise<void>) => {
    await callback(transaction);
  });
  t.mock.method(TimetableAnalyticsRepository, "findCoursesByIds", async () => []);
  t.mock.method(
    TimetableAnalyticsRepository,
    "deleteMissingSemesters",
    async (_clientId: string, receivedActiveSemesters: string[]) => {
      activeSemesters = receivedActiveSemesters;
      return 1;
    }
  );

  await TimetableAnalyticsService.syncGuestSnapshot({
    clientId: CLIENT_ID,
    semesters: { "115-1": [] },
  });

  assert.deepEqual(activeSemesters, []);
});
