import { Transaction } from "sequelize";
import InterestModel from "../models/Interest";
import { Interest } from "../types/interest";

class InterestRepository {
  async findInterest(user_id: number, course_id: number): Promise<Interest | null>{
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
}

export default new InterestRepository();