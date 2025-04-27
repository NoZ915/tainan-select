import { Transaction } from "sequelize";
import InterestModel from "../models/Interest";

class InterestRepository {
  async addInterest(user_id: number, course_id: number, transaction: Transaction): Promise<void> {
    await InterestModel.create({ user_id, course_id }, { transaction })
  }
}

export default new InterestRepository();