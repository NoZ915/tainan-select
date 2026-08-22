import assert from "node:assert/strict";
import test from "node:test";
import { createFixedWindowRateLimiter } from "../../utils/fixedWindowRateLimiter";

test("固定時間窗超過來源請求上限後拒絕", () => {
  const isRateLimited = createFixedWindowRateLimiter({
    windowMs: 1_000,
    maxRequests: 2,
    maxSources: 10,
  });

  assert.equal(isRateLimited("source-a", 0), false);
  assert.equal(isRateLimited("source-a", 1), false);
  assert.equal(isRateLimited("source-a", 2), true);
  assert.equal(isRateLimited("source-b", 2), false);
});

test("固定時間窗到期後重新計數", () => {
  const isRateLimited = createFixedWindowRateLimiter({
    windowMs: 1_000,
    maxRequests: 1,
    maxSources: 10,
  });

  assert.equal(isRateLimited("source-a", 0), false);
  assert.equal(isRateLimited("source-a", 1), true);
  assert.equal(isRateLimited("source-a", 1_000), false);
});

test("來源在全域清理後才建立仍會依自己的窗口重設", () => {
  const isRateLimited = createFixedWindowRateLimiter({
    windowMs: 1_000,
    maxRequests: 1,
    maxSources: 10,
  });

  assert.equal(isRateLimited("cleanup-anchor", 0), false);
  assert.equal(isRateLimited("source-a", 500), false);
  assert.equal(isRateLimited("source-a", 501), true);
  assert.equal(isRateLimited("source-a", 1_500), false);
});

test("來源紀錄數量有上限", () => {
  const isRateLimited = createFixedWindowRateLimiter({
    windowMs: 1_000,
    maxRequests: 1,
    maxSources: 1,
  });

  assert.equal(isRateLimited("source-a", 0), false);
  assert.equal(isRateLimited("source-b", 1), false);
  assert.equal(isRateLimited("source-a", 2), false);
});
