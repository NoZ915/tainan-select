import assert from "node:assert/strict";
import test from "node:test";
import { Transaction } from "sequelize";
import db from "../../models";
import CourseRepository from "../../repositories/courseRepository";
import GuestTimetableSnapshotRepository from "../../repositories/guestTimetableSnapshotRepository";
import {
  normalizeGuestSnapshotInput,
  GuestTimetableSnapshotServiceError,
} from "../../services/guestTimetableSnapshotService";
import GuestTimetableSnapshotService from "../../services/guestTimetableSnapshotService";

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
      (error) => error instanceof GuestTimetableSnapshotServiceError && error.status === 400
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
  t.mock.method(CourseRepository, "findSemestersByIds", async () => [
    { id: 1, semester: "115-1" },
    { id: 2, semester: "114-2" },
  ]);
  t.mock.method(
    GuestTimetableSnapshotRepository,
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
    GuestTimetableSnapshotRepository,
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

  await GuestTimetableSnapshotService.syncGuestSnapshot({
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

test("不存在或學期不一致的課程會被忽略，不影響有效課程同步", async (t) => {
  const transaction = {} as Transaction;

  t.mock.method(db.sequelize, "transaction", async (callback: (value: Transaction) => Promise<void>) => {
    await callback(transaction);
  });
  t.mock.method(CourseRepository, "findSemestersByIds", async () => [
    { id: 1, semester: "115-1" },
    { id: 2, semester: "114-2" },
  ]);
  const upsertMock = t.mock.method(GuestTimetableSnapshotRepository, "upsertSnapshot", async () => {});
  const deleteMock = t.mock.method(
    GuestTimetableSnapshotRepository,
    "deleteMissingSemesters",
    async () => 0
  );

  await GuestTimetableSnapshotService.syncGuestSnapshot({
    clientId: CLIENT_ID,
    semesters: { "115-1": [1, 2, 3] },
  });

  assert.equal(upsertMock.mock.callCount(), 1);
  assert.deepEqual(upsertMock.mock.calls[0].arguments.slice(0, 3), [
    CLIENT_ID,
    "115-1",
    [1],
  ]);
  assert.equal(deleteMock.mock.callCount(), 1);
  assert.deepEqual(deleteMock.mock.calls[0].arguments.slice(0, 2), [
    CLIENT_ID,
    ["115-1"],
  ]);
});

test("空課表 payload 會移除該 client 的所有有效 snapshot", async (t) => {
  const transaction = {} as Transaction;
  let activeSemesters: string[] | undefined;

  t.mock.method(db.sequelize, "transaction", async (callback: (value: Transaction) => Promise<void>) => {
    await callback(transaction);
  });
  t.mock.method(CourseRepository, "findSemestersByIds", async () => []);
  t.mock.method(
    GuestTimetableSnapshotRepository,
    "deleteMissingSemesters",
    async (_clientId: string, receivedActiveSemesters: string[]) => {
      activeSemesters = receivedActiveSemesters;
      return 1;
    }
  );

  await GuestTimetableSnapshotService.syncGuestSnapshot({
    clientId: CLIENT_ID,
    semesters: { "115-1": [] },
  });

  assert.deepEqual(activeSemesters, []);
});

test("同一 client 的重疊同步會依收到順序序列化", async (t) => {
  const transaction = {} as Transaction;
  let transactionCount = 0;
  let releaseFirstTransaction: (() => void) | undefined;
  const firstTransactionCanFinish = new Promise<void>((resolve) => {
    releaseFirstTransaction = resolve;
  });

  t.mock.method(
    db.sequelize,
    "transaction",
    async (callback: (value: Transaction) => Promise<void>) => {
      transactionCount += 1;
      if (transactionCount === 1) await firstTransactionCanFinish;
      await callback(transaction);
    }
  );
  t.mock.method(CourseRepository, "findSemestersByIds", async () => []);
  t.mock.method(
    GuestTimetableSnapshotRepository,
    "deleteMissingSemesters",
    async () => 0
  );

  const firstSync = GuestTimetableSnapshotService.syncGuestSnapshot({
    clientId: CLIENT_ID,
    semesters: {},
  });
  await new Promise<void>((resolve) => setImmediate(resolve));

  const secondSync = GuestTimetableSnapshotService.syncGuestSnapshot({
    clientId: CLIENT_ID,
    semesters: {},
  });
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.equal(transactionCount, 1);
  releaseFirstTransaction?.();
  await Promise.all([firstSync, secondSync]);
  assert.equal(transactionCount, 2);
});
