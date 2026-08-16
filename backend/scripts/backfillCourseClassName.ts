import "dotenv/config";
import pLimit from "p-limit";
import * as cheerio from "cheerio";
import db from "../models";
import CourseModel from "../models/Course";
import { getWithRetry } from "../scraper/httpClient";
import { extractClassName, parseGradesFromClassName, parseGraduateLevelsFromClassName } from "../utils/parseCourseClass";

const BATCH_SIZE = 300;
const CONCURRENCY = 6;

const backfillCourseClassName = async (): Promise<void> => {
  await db.sequelize.authenticate();
  console.log("MySQL 連線成功");

  const totalCourses = await CourseModel.count();
  let offset = 0;

  let scanned = 0;
  let updated = 0;
  let skippedAlreadySet = 0;
  let skippedNoUrl = 0;
  let failed = 0;

  const limit = pLimit(CONCURRENCY);

  while (offset < totalCourses) {
    const courses = await CourseModel.findAll({
      attributes: ["id", "course_url", "class_name"],
      limit: BATCH_SIZE,
      offset,
      order: [["id", "ASC"]],
    });

    if (courses.length === 0) break;

    const tasks = courses.map((course) =>
      limit(async () => {
        scanned += 1;

        if (course.class_name) {
          skippedAlreadySet += 1;
          return;
        }

        if (!course.course_url) {
          skippedNoUrl += 1;
          return;
        }

        try {
          const res = await getWithRetry(course.course_url);
          const coursePage$ = cheerio.load(res.data);

          const courseClassElement = coursePage$("#Label5").clone();
          courseClassElement.find("br").replaceWith("\n");
          const rawCourseClass = courseClassElement.text();
          const className = extractClassName(rawCourseClass);
          const grades = className ? parseGradesFromClassName(className) : null;
          const graduateLevels = className ? parseGraduateLevelsFromClassName(className) : null;

          if (className) {
            await course.update({ class_name: className, grades, graduate_levels: graduateLevels });
            updated += 1;
          }
        } catch (error) {
          failed += 1;
          console.error(`回填 class_name 失敗, course_id=${course.id}`, error);
        }
      })
    );

    await Promise.all(tasks);

    offset += courses.length;
    console.log(`進度 ${scanned}/${totalCourses}`);
  }

  console.log("=== backfillCourseClassName 完成 ===");
  console.log(`掃描課程數: ${scanned}`);
  console.log(`成功回填: ${updated}`);
  console.log(`已有資料略過: ${skippedAlreadySet}`);
  console.log(`無 course_url 略過: ${skippedNoUrl}`);
  console.log(`失敗課程數: ${failed}`);
};

backfillCourseClassName()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("backfillCourseClassName 執行失敗:", error);
    process.exit(1);
  });
