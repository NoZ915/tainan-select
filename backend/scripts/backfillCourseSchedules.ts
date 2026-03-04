import "dotenv/config";
import db from "../models";
import CourseModel from "../models/Course";
import CourseScheduleModel from "../models/CourseSchedule";
import { normalizeCourseTime, parseCourseTime } from "../utils/parseCourseTime";

const BATCH_SIZE = 300;

const backfillCourseSchedules = async (): Promise<void> => {
  await db.sequelize.authenticate();
  console.log("MySQL 連線成功");

  const totalCourses = await CourseModel.count();
  let offset = 0;

  let scanned = 0;
  let updatedCourseTime = 0;
  let rebuiltSchedules = 0;
  let skippedNoTime = 0;
  let skippedParseEmpty = 0;
  let failed = 0;

  while (offset < totalCourses) {
    const courses = await CourseModel.findAll({
      attributes: ["id", "course_time"],
      limit: BATCH_SIZE,
      offset,
      order: [["id", "ASC"]],
    });

    if (courses.length === 0) break;

    for (const course of courses) {
      scanned += 1;
      try {
        const rawCourseTime = course.course_time ?? "";
        const normalizedCourseTime = normalizeCourseTime(rawCourseTime);

        if (!normalizedCourseTime) {
          skippedNoTime += 1;
          await CourseScheduleModel.destroy({ where: { course_id: course.id } });
          continue;
        }

        if (normalizedCourseTime !== rawCourseTime) {
          await course.update({ course_time: normalizedCourseTime });
          updatedCourseTime += 1;
        }

        const schedules = parseCourseTime(normalizedCourseTime);
        await CourseScheduleModel.destroy({ where: { course_id: course.id } });

        if (schedules.length === 0) {
          skippedParseEmpty += 1;
          continue;
        }

        await CourseScheduleModel.bulkCreate(
          schedules.map((item) => ({
            course_id: course.id,
            day: item.day,
            start_period: item.startPeriod,
            span: item.span,
          }))
        );
        rebuiltSchedules += 1;
      } catch (error) {
        failed += 1;
        console.error(`重建 CourseSchedules 失敗, course_id=${course.id}`, error);
      }
    }

    offset += courses.length;
    console.log(`進度 ${scanned}/${totalCourses}`);
  }

  const totalSchedules = await CourseScheduleModel.count();
  console.log("=== backfill 完成 ===");
  console.log(`掃描課程數: ${scanned}`);
  console.log(`正規化並更新 course_time: ${updatedCourseTime}`);
  console.log(`重建成功課程數: ${rebuiltSchedules}`);
  console.log(`無課程時間略過: ${skippedNoTime}`);
  console.log(`解析後無時段略過: ${skippedParseEmpty}`);
  console.log(`失敗課程數: ${failed}`);
  console.log(`CourseSchedules 目前總筆數: ${totalSchedules}`);
};

backfillCourseSchedules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("backfillCourseSchedules 執行失敗:", error);
    process.exit(1);
  });
