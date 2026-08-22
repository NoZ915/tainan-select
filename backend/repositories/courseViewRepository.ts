import { Op } from "sequelize";
import CourseViewModel from "../models/CourseView"

export type CourseViewIdentity = {
  courseId: number;
} & (
  | { userId: number; clientId: null }
  | { userId: null; clientId: string }
);

class CourseViewRepository {
  async hasRecentView({ courseId, userId, clientId }: CourseViewIdentity): Promise<boolean> {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

    const condition = userId !== null
      ? {
        course_id: courseId,
        user_id: userId,
        viewed_at: { [Op.gt]: tenMinsAgo },
      }
    : {
        course_id: courseId,
        client_id: clientId,
        viewed_at: { [Op.gt]: tenMinsAgo },
      };

      const recentView = await CourseViewModel.findOne({
        where: condition,
        order: [['viewed_at', 'DESC']],
      });
    
      return Boolean(recentView);
  }

  async insertCourseView({ courseId, userId, clientId }: CourseViewIdentity): Promise<void> {
    await CourseViewModel.create({
      course_id: courseId,
      user_id: userId,
      client_id: clientId,
      viewed_at: new Date(),
    });
  }
}

export default new CourseViewRepository();
