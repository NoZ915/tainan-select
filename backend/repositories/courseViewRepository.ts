import { Op } from "sequelize";
import CourseViewModel from "../models/CourseView"

class CourseViewRepository {
  async shouldInsertView(
    course_id: number,
    user_id: number | undefined,
    ip_address: string | undefined,
    user_agent: string | undefined
  ): Promise<boolean> {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

    const condition = user_id
      ? {
        course_id,
        user_id,
        viewed_at: { [Op.gt]: tenMinsAgo },
      }
    : {
        course_id,
        ip_address,
        user_agent,
        viewed_at: { [Op.gt]: tenMinsAgo },
      };

      const recentView = await CourseViewModel.findOne({
        where: condition,
        order: [['viewed_at', 'DESC']],
      });
    
      return !recentView;
  }

  async insertCourseView(
    course_id: number,
    user_id: number | undefined,
    ip_address: string | undefined,
    user_agent: string | undefined
  ): Promise<void> {
    await CourseViewModel.create({
      course_id,
      user_id,
      ip_address,
      user_agent,
      viewed_at: new Date(),
    });
  }
}

export default new CourseViewRepository();