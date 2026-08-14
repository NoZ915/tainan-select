import "dotenv/config";
import db from "../models";
import CourseModel from "../models/Course";
import { parseCourseIdentityFromUrl } from "../utils/courseIdentity";

const BATCH_SIZE = 300;

const backfillCourseIdentity = async (): Promise<void> => {
  await db.sequelize.authenticate();
  console.log("MySQL 連線成功");

  const totalCourses = await CourseModel.count();
  let offset = 0;

  let scanned = 0;
  let updated = 0;
  let skippedNoUrl = 0;
  let skippedAlreadySet = 0;

  while (offset < totalCourses) {
    const courses = await CourseModel.findAll({
      attributes: ["id", "course_url", "cour_no", "course_dep_code"],
      limit: BATCH_SIZE,
      offset,
      order: [["id", "ASC"]],
    });

    if (courses.length === 0) break;

    for (const course of courses) {
      scanned += 1;

      if (course.cour_no && course.course_dep_code) {
        skippedAlreadySet += 1;
        continue;
      }

      const identity = parseCourseIdentityFromUrl(course.course_url ?? undefined);
      if (!identity) {
        skippedNoUrl += 1;
        continue;
      }

      await course.update({
        cour_no: identity.cour_no,
        course_dep_code: identity.course_dep_code,
      });
      updated += 1;
    }

    offset += courses.length;
    console.log(`進度 ${scanned}/${totalCourses}`);
  }

  console.log("=== backfillCourseIdentity 完成 ===");
  console.log(`掃描課程數: ${scanned}`);
  console.log(`成功回填: ${updated}`);
  console.log(`已有資料略過: ${skippedAlreadySet}`);
  console.log(`course_url 無法解析略過: ${skippedNoUrl}`);
};

backfillCourseIdentity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("backfillCourseIdentity 執行失敗:", error);
    process.exit(1);
  });
