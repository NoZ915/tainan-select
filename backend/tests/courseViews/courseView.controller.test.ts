import assert from "node:assert/strict";
import test from "node:test";
import { NextFunction, Request, Response } from "express";
import { getCourse } from "../../controllers/courseController";
import CourseService from "../../services/courseService";
import CourseViewService from "../../services/courseViewService";

const createResponse = () => {
  const state: { status?: number; body?: unknown } = {};
  const response = {
    status(status: number) {
      state.status = status;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  } as unknown as Response;
  return { response, state };
};

const next = (() => {}) as NextFunction;

test("匿名課程瀏覽會將 clientId 傳入 tracking", async (t) => {
  const course = { course: { id: 12 } };
  t.mock.method(CourseService, "getCourse", async () => course as never);
  const trackingMock = t.mock.method(CourseViewService, "trackCourseView", async () => true);
  const countMock = t.mock.method(CourseService, "addViewCount", async () => {});
  const { response, state } = createResponse();

  await getCourse({
    params: { course_id: "12" },
    query: {},
    header: (name: string) => name === "x-analytics-client-id"
      ? "550e8400-e29b-41d4-a716-446655440000"
      : undefined,
  } as unknown as Request, response, next);

  assert.deepEqual(trackingMock.mock.calls[0].arguments[0], {
    courseId: 12,
    userId: undefined,
    clientId: "550e8400-e29b-41d4-a716-446655440000",
  });
  assert.equal(countMock.mock.callCount(), 1);
  assert.deepEqual(state, { status: 200, body: course });
});

test("CourseView tracking 失敗不影響課程詳情回應", async (t) => {
  const course = { course: { id: 12 } };
  const trackingError = new Error("database unavailable");
  t.mock.method(CourseService, "getCourse", async () => course as never);
  t.mock.method(CourseViewService, "trackCourseView", async () => { throw trackingError; });
  const errorMock = t.mock.method(console, "error", () => {});
  const { response, state } = createResponse();

  await getCourse({
    params: { course_id: "12" },
    query: {},
    header: () => undefined,
  } as unknown as Request, response, next);

  assert.deepEqual(state, { status: 200, body: course });
  assert.deepEqual(errorMock.mock.calls[0].arguments, ["記錄課程瀏覽失敗", trackingError]);
});

test("CourseView 去重與寫入完成後才回傳課程詳情", async (t) => {
  const course = { course: { id: 12 } };
  let finishTracking: ((inserted: boolean) => void) | undefined;
  t.mock.method(CourseService, "getCourse", async () => course as never);
  t.mock.method(CourseViewService, "trackCourseView", () => new Promise<boolean>((resolve) => {
    finishTracking = resolve;
  }));
  const { response, state } = createResponse();

  const courseRequest = getCourse({
    params: { course_id: "12" },
    query: {},
    header: () => undefined,
  } as unknown as Request, response, next);

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state, {});
  assert.ok(finishTracking);
  finishTracking?.(false);
  await courseRequest;
  assert.deepEqual(state, { status: 200, body: course });
});
