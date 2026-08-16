import "dotenv/config";
import db from "../models";
import CourseModel from "../models/Course";
import { parseGraduateLevelsFromClassName } from "../utils/parseCourseClass";

const BATCH_SIZE = 300;

const backfillGraduateLevels = async (): Promise<void> => {
  await db.sequelize.authenticate();
  console.log("MySQL 連線成功");

  const totalCourses = await CourseModel.count();
  let offset = 0;

  let scanned = 0;
  let classified = 0;
  let skippedNoClassName = 0;
  let unclassified = 0;

  while (offset < totalCourses) {
    const courses = await CourseModel.findAll({
      attributes: ["id", "class_name"],
      limit: BATCH_SIZE,
      offset,
      order: [["id", "ASC"]],
    });

    if (courses.length === 0) break;

    for (const course of courses) {
      scanned += 1;

      if (!course.class_name) {
        skippedNoClassName += 1;
        continue;
      }

      const graduateLevels = parseGraduateLevelsFromClassName(course.class_name);
      await course.update({ graduate_levels: graduateLevels });

      if (graduateLevels) {
        classified += 1;
      } else {
        unclassified += 1;
      }
    }

    offset += courses.length;
    console.log(`進度 ${scanned}/${totalCourses}`);
  }

  console.log("=== backfillGraduateLevels 完成 ===");
  console.log(`掃描課程數: ${scanned}`);
  console.log(`成功分類: ${classified}`);
  console.log(`無法分類(保留 null): ${unclassified}`);
  console.log(`無 class_name 略過: ${skippedNoClassName}`);
};

backfillGraduateLevels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("backfillGraduateLevels 執行失敗:", error);
    process.exit(1);
  });
