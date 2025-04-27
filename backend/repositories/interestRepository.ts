import { Transaction } from "sequelize";
import InterestModel from "../models/Interest";
import { AllInterestsResponse, Interest } from "../types/interest";
import CourseModel from "../models/Course";

class InterestRepository {
  async findInterest(user_id: number, course_id: number): Promise<Interest | null> {
    return await InterestModel.findOne({
      where: { user_id, course_id }
    })
  }

  async addInterest(user_id: number, course_id: number, transaction: Transaction): Promise<void> {
    await InterestModel.create({ user_id, course_id }, { transaction })
  }

  async removeInterest(user_id: number, course_id: number, transaction: Transaction): Promise<void> {
    await InterestModel.destroy({
      where: { user_id, course_id },
      transaction
    });
  }

  async getAllInterests(user_id: number): Promise<AllInterestsResponse[]> {
    const interests = await InterestModel.findAll({
      where: { user_id },
      include: [
        {
          model: CourseModel,
          as: 'course',
          attributes: ["id", "course_name", "department", "academy", "instructor", "instructor_url", "course_room", "course_time", "course_url", "credit_hours", "semester", "created_at", "updated_at", "course_type", "interests_count", "view_count", "review_count"]
        }
      ]
    });

    return interests as unknown as AllInterestsResponse[];
  }
}

export default new InterestRepository();