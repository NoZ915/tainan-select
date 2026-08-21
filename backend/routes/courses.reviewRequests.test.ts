import assert from "node:assert/strict";
import test from "node:test";
import router from "./courses";

test("review-requests route 位於動態 course_id route 前", () => {
  const paths = (router as unknown as {
    stack: Array<{ route?: { path: string } }>;
  }).stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route!.path);

  const reviewRequestIndex = paths.indexOf("/review-requests");
  const courseIdIndex = paths.indexOf("/:course_id");
  assert.ok(reviewRequestIndex >= 0);
  assert.ok(courseIdIndex >= 0);
  assert.ok(reviewRequestIndex < courseIdIndex);
});
