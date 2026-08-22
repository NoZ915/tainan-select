import assert from "node:assert/strict";
import test from "node:test";
import CourseViewRepository from "../../repositories/courseViewRepository";
import CourseViewService from "../../services/courseViewService";

const CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

test("登入瀏覽以 user_id 去重並保留有效 clientId", async (t) => {
  const recentMock = t.mock.method(CourseViewRepository, "hasRecentView", async () => false);
  const insertMock = t.mock.method(CourseViewRepository, "insertCourseView", async () => {});

  assert.equal(await CourseViewService.trackCourseView({
    courseId: 12,
    userId: 8,
    clientId: CLIENT_ID,
  }), true);

  const identity = { courseId: 12, userId: 8, clientId: CLIENT_ID };
  assert.deepEqual(recentMock.mock.calls[0].arguments[0], identity);
  assert.deepEqual(insertMock.mock.calls[0].arguments[0], identity);
});

test("登入瀏覽缺少有效 clientId 時仍使用 user_id 記錄", async (t) => {
  const recentMock = t.mock.method(CourseViewRepository, "hasRecentView", async () => false);
  const insertMock = t.mock.method(CourseViewRepository, "insertCourseView", async () => {});

  assert.equal(await CourseViewService.trackCourseView({
    courseId: 12,
    userId: 8,
    clientId: "invalid",
  }), true);

  const identity = { courseId: 12, userId: 8, clientId: null };
  assert.deepEqual(recentMock.mock.calls[0].arguments[0], identity);
  assert.deepEqual(insertMock.mock.calls[0].arguments[0], identity);
});

test("匿名瀏覽使用共用 clientId，缺少或無效 identity 時略過", async (t) => {
  const recentMock = t.mock.method(CourseViewRepository, "hasRecentView", async () => false);
  const insertMock = t.mock.method(CourseViewRepository, "insertCourseView", async () => {});

  assert.equal(await CourseViewService.trackCourseView({ courseId: 12 }), false);
  assert.equal(await CourseViewService.trackCourseView({ courseId: 12, clientId: "invalid" }), false);
  assert.equal(recentMock.mock.callCount(), 0);
  assert.equal(insertMock.mock.callCount(), 0);

  assert.equal(await CourseViewService.trackCourseView({
    courseId: 12,
    clientId: CLIENT_ID.toUpperCase(),
  }), true);
  assert.deepEqual(insertMock.mock.calls[0].arguments[0], {
    courseId: 12,
    userId: null,
    clientId: CLIENT_ID,
  });
});

test("10 分鐘內已有相同 identity 時不重複新增", async (t) => {
  t.mock.method(CourseViewRepository, "hasRecentView", async () => true);
  const insertMock = t.mock.method(CourseViewRepository, "insertCourseView", async () => {});

  assert.equal(await CourseViewService.trackCourseView({
    courseId: 12,
    clientId: CLIENT_ID,
  }), false);
  assert.equal(insertMock.mock.callCount(), 0);
});
