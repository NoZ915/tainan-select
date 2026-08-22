import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsClientId } from "../../utils/analyticsClientId";

const CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

test("Analytics Client ID 共用相同 UUID 驗證與小寫正規化", () => {
  assert.equal(normalizeAnalyticsClientId(CLIENT_ID.toUpperCase()), CLIENT_ID);
  assert.equal(normalizeAnalyticsClientId("invalid"), null);
  assert.equal(normalizeAnalyticsClientId([CLIENT_ID]), null);
  assert.equal(normalizeAnalyticsClientId("x".repeat(500)), null);
});
