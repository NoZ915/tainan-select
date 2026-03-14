import "dotenv/config";
import db from "../models";
import CourseModel from "../models/Course";
import CourseRepository from "../repositories/courseRepository";

const backfillDcardRelatedPostCounts = async (): Promise<void> => {
  const courses = await CourseModel.findAll({
    attributes: ["id"],
    raw: true,
  }) as Array<{ id: number }>;

  const courseIds = courses.map((course) => Number(course.id)).filter((courseId) => Number.isInteger(courseId) && courseId > 0);

  if (courseIds.length === 0) {
    console.log("No courses found.");
    return;
  }

  await db.sequelize.transaction(async (transaction) => {
    await CourseRepository.recalculateDcardRelatedPostCounts(courseIds, transaction);
  });

  console.log(`Backfilled dcard_related_post_count for ${courseIds.length} course(s).`);
};

backfillDcardRelatedPostCounts()
  .then(async () => {
    await db.sequelize.close();
  })
  .catch(async (error) => {
    console.error("backfillDcardRelatedPostCounts failed:", error);
    await db.sequelize.close();
    process.exit(1);
  });
