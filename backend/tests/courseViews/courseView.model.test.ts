import assert from "node:assert/strict";
import test from "node:test";
import CourseViewModel from "../../models/CourseView";

test("CourseViews 保留舊識別欄位並新增 nullable client_id 與 dedupe index", () => {
  assert.equal(CourseViewModel.rawAttributes.client_id.allowNull, true);
  assert.ok(CourseViewModel.rawAttributes.ip_address);
  assert.ok(CourseViewModel.rawAttributes.user_agent);

  const clientIndex = CourseViewModel.options.indexes?.find(
    (index) => index.name === "idx_course_client_viewed"
  );
  assert.deepEqual(clientIndex?.fields, ["course_id", "client_id", "viewed_at"]);
});
