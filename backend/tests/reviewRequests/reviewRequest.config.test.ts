import assert from "node:assert/strict";
import test from "node:test";
import {
  getInterestWeightByAgeDays,
  getReviewNeedFactor,
  REVIEW_REQUEST_CONFIG,
} from "../../config/reviewRequest";

test("收藏 freshness 在各天數邊界使用逐筆權重", () => {
  assert.deepEqual(
    [0, 30, 31, 60, 61, 90, 91, 120, 121, 180, 181].map(
      getInterestWeightByAgeDays
    ),
    [5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0]
  );
});

test("review count 依集中設定套用資訊缺口 factor", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 7, 8, 20].map(getReviewNeedFactor),
    [1, 0.8, 0.6, 0.4, 0.4, 0.2, 0.2, 0.1, 0.1]
  );
  assert.equal(REVIEW_REQUEST_CONFIG.guestSnapshotTtlDays, 180);
});
