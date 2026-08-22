import assert from "node:assert/strict";
import test from "node:test";
import { QueryTypes } from "sequelize";
import db from "../../models";
import CourseRepository from "../../repositories/courseRepository";

test("求評價排行使用單次 aggregate query、JSON snapshot 與安全參數", async (t) => {
  const queryMock = t.mock.method(db.sequelize, "query", async () => []);

  await CourseRepository.getReviewRequestCourses("115-1", 5);

  const [sql, options] = queryMock.mock.calls[0].arguments;
  assert.equal(typeof sql, "string");
  const query = String(sql);
  assert.match(query, /COUNT\(DISTINCT timetable_items\.timetable_id\)/);
  assert.match(query, /JSON_TABLE\(/);
  assert.match(query, /COUNT\(DISTINCT guest_snapshots\.client_id\)/);
  assert.match(query, /guest_snapshots\.last_synced_at >= DATE_SUB/);
  assert.doesNotMatch(query, /\bview_count\b/i);
  assert.deepEqual(options?.replacements, {
    semester: "115-1",
    limit: 5,
    interestTtlDays: 180,
    guestSnapshotTtlDays: 180,
  });
  assert.equal(options?.type, QueryTypes.SELECT);
});

test("求評價排行 tie-breaker 順序固定", async (t) => {
  const queryMock = t.mock.method(db.sequelize, "query", async () => []);

  await CourseRepository.getReviewRequestCourses("115-1", 20);

  const query = String(queryMock.mock.calls[0].arguments[0]);
  const sortExpressions = [
    "reviewRequestScore DESC",
    "ranked.timetableCount DESC",
    "ranked.weightedFavoriteScore DESC",
    "ranked.review_count ASC",
    "ranked.id DESC",
  ];
  const positions = sortExpressions.map((expression) => query.indexOf(expression));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((first, second) => first - second), positions);
});
