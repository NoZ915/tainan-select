import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCourseTime, parseCourseTime } from "../../utils/parseCourseTime";

test("不將英文星期錯字的字母解析為節次", () => {
  assert.equal(
    normalizeCourseTime("星期五，節次8\nFir, Period 8、9、A"),
    "星期五，節次8、9、A"
  );
  assert.equal(
    normalizeCourseTime("星期五，節次CFir, Period C、D、E"),
    "星期五，節次C、D、E"
  );
});

test("節次間沒有分隔符時不會把後續文字視為節次", () => {
  assert.equal(normalizeCourseTime("星期五，節次8Fir"), "星期五，節次8");
});

test("保留中文與英文單一格式的相容性", () => {
  assert.equal(normalizeCourseTime("星期五，節次8、9、A"), "星期五，節次8、9、A");
  assert.equal(normalizeCourseTime("Fri, Period 8、9、A"), "星期五，節次8、9、A");
});

test("以中文星期分隔多個上課時段", () => {
  const rawCourseTime = [
    "星期二，節次3Tue, Period 3、4",
    "星期五，節次8Fir, Period 8、9、A",
  ].join("");

  assert.equal(
    normalizeCourseTime(rawCourseTime),
    "星期二，節次3、4；星期五，節次8、9、A"
  );
});

test("產生正確的課程節次範圍", () => {
  assert.deepEqual(parseCourseTime("星期五，節次8\nFir, Period 8、9、A"), [
    { day: 5, startPeriod: "8", span: 3 },
  ]);
});
