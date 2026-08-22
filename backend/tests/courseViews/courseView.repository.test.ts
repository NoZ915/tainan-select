import assert from "node:assert/strict";
import test from "node:test";
import { Op } from "sequelize";
import CourseViewModel from "../../models/CourseView";
import CourseViewRepository from "../../repositories/courseViewRepository";

const CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

test("匿名瀏覽以 course_id、client_id 與時間去重", async (t) => {
  const findMock = t.mock.method(CourseViewModel, "findOne", async () => null);

  assert.equal(await CourseViewRepository.hasRecentView({
    courseId: 12,
    userId: null,
    clientId: CLIENT_ID,
  }), false);

  const where = findMock.mock.calls[0].arguments[0]?.where as Record<string | symbol, unknown>;
  assert.equal(where.course_id, 12);
  assert.equal(where.client_id, CLIENT_ID);
  assert.equal(where.ip_address, undefined);
  assert.equal(where.user_agent, undefined);
  assert.ok((where.viewed_at as Record<symbol, unknown>)[Op.gt]);
});

test("新瀏覽只寫入單一 identity，不再寫入 IP 或 user-agent", async (t) => {
  const createMock = t.mock.method(CourseViewModel, "create", async (values: object) => values as CourseViewModel);

  await CourseViewRepository.insertCourseView({
    courseId: 12,
    userId: null,
    clientId: CLIENT_ID,
  });

  const values = createMock.mock.calls[0]!.arguments[0] as Record<string, unknown>;
  assert.equal(values.user_id, null);
  assert.equal(values.client_id, CLIENT_ID);
  assert.equal(values.ip_address, undefined);
  assert.equal(values.user_agent, undefined);
});
