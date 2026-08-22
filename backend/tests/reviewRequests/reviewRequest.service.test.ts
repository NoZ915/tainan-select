import assert from "node:assert/strict";
import test from "node:test";
import CourseRepository from "../../repositories/courseRepository";
import CourseService, { ReviewRequestServiceError } from "../../services/courseService";

test("求評價排行驗證 semester 與 limit", async () => {
  await assert.rejects(
    CourseService.getReviewRequestCourses("115-3", 5),
    (error) => error instanceof ReviewRequestServiceError && error.status === 400
  );
  await assert.rejects(
    CourseService.getReviewRequestCourses("115-1", "5abc"),
    ReviewRequestServiceError
  );
  await assert.rejects(
    CourseService.getReviewRequestCourses("115-1", 21),
    ReviewRequestServiceError
  );
});

test("求評價排行只查指定學期並將 aggregate 數值正規化", async (t) => {
  const repositoryMock = t.mock.method(
    CourseRepository,
    "getReviewRequestCourses",
    async () => [{
      id: 123,
      course_name: "資料結構",
      department: "資訊工程學系",
      instructor: "測試教師",
      review_count: 0,
      recentInterestCount: "5",
      weightedFavoriteScore: "21",
      timetableCount: "12",
      reviewRequestScore: "33",
    }]
  );

  const result = await CourseService.getReviewRequestCourses(" 115-1 ", undefined);

  assert.deepEqual(repositoryMock.mock.calls[0].arguments, ["115-1", 5]);
  assert.deepEqual(result, {
    semester: "115-1",
    items: [{
      course: {
        id: 123,
        course_name: "資料結構",
        department: "資訊工程學系",
        instructor: "測試教師",
        review_count: 0,
      },
      signals: {
        recentInterestCount: 5,
        weightedFavoriteScore: 21,
        timetableCount: 12,
        reviewCount: 0,
      },
      reviewRequestScore: 33,
    }],
  });
});

test("沒有候選課程時回傳空 items", async (t) => {
  t.mock.method(CourseRepository, "getReviewRequestCourses", async () => []);

  assert.deepEqual(
    await CourseService.getReviewRequestCourses("115-1", 5),
    { semester: "115-1", items: [] }
  );
});
