import assert from "node:assert/strict";
import test from "node:test";
import { NextFunction, Request, Response } from "express";
import CourseService, { ReviewRequestServiceError } from "../../services/courseService";
import { getReviewRequestCourses } from "../../controllers/courseController";

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

test("GET review-requests 傳遞 query 並回傳排行", async (t) => {
  const result = { semester: "115-1", items: [] };
  const serviceMock = t.mock.method(CourseService, "getReviewRequestCourses", async () => result);
  const { response, state } = createResponse();

  await getReviewRequestCourses({
    query: { semester: "115-1", limit: "5" },
  } as unknown as Request, response, next);

  assert.deepEqual(serviceMock.mock.calls[0].arguments, ["115-1", "5"]);
  assert.deepEqual(state, { status: 200, body: result });
});

test("GET review-requests 的輸入錯誤回傳 400", async (t) => {
  t.mock.method(CourseService, "getReviewRequestCourses", async () => {
    throw new ReviewRequestServiceError(400, "semester 格式錯誤");
  });
  const { response, state } = createResponse();

  await getReviewRequestCourses({ query: {} } as Request, response, next);

  assert.deepEqual(state, {
    status: 400,
    body: { message: "semester 格式錯誤" },
  });
});
