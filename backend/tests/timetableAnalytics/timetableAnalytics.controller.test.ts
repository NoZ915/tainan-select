import assert from "node:assert/strict";
import test from "node:test";
import { NextFunction, Request, Response } from "express";
import TimetableAnalyticsService, {
  TimetableAnalyticsServiceError,
} from "../../services/timetableAnalyticsService";
import {
  deleteGuestTimetableSnapshot,
  syncGuestTimetableSnapshot,
} from "../../controllers/timetableAnalyticsController";

const createResponse = () => {
  const state: { status?: number; body?: unknown; sent?: boolean } = {};
  const response = {
    status(status: number) {
      state.status = status;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
    send() {
      state.sent = true;
      return response;
    },
  } as unknown as Response;
  return { response, state };
};

const next = (() => {}) as NextFunction;

test("PUT guest snapshot 成功時回傳 204", async (t) => {
  const body = { clientId: "550e8400-e29b-41d4-a716-446655440000", semesters: {} };
  const serviceMock = t.mock.method(TimetableAnalyticsService, "syncGuestSnapshot", async () => {});
  const { response, state } = createResponse();

  await syncGuestTimetableSnapshot({ body } as Request, response, next);

  assert.equal(serviceMock.mock.calls[0].arguments[0], body);
  assert.deepEqual(state, { status: 204, sent: true });
});

test("DELETE guest snapshot 會呼叫刪除服務", async (t) => {
  const body = { clientId: "550e8400-e29b-41d4-a716-446655440000" };
  const serviceMock = t.mock.method(TimetableAnalyticsService, "deleteGuestSnapshot", async () => {});
  const { response, state } = createResponse();

  await deleteGuestTimetableSnapshot({ body } as Request, response, next);

  assert.equal(serviceMock.mock.calls[0].arguments[0], body);
  assert.deepEqual(state, { status: 204, sent: true });
});

test("輸入驗證錯誤會回傳安全的 400 訊息", async (t) => {
  t.mock.method(TimetableAnalyticsService, "syncGuestSnapshot", async () => {
    throw new TimetableAnalyticsServiceError(400, "clientId 必須是有效的 UUID");
  });
  const { response, state } = createResponse();

  await syncGuestTimetableSnapshot({ body: {} } as Request, response, next);

  assert.deepEqual(state, {
    status: 400,
    body: { message: "clientId 必須是有效的 UUID" },
  });
});
