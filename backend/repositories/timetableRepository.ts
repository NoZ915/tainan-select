import TimetableModel from "../models/Timetable";
import { UniqueConstraintError } from "sequelize";

class TimetableRepository {
  async findByUserAndSemester(user_id: number, semester: string): Promise<TimetableModel | null> {
    return await TimetableModel.findOne({
      where: { user_id, semester },
    });
  }

  async create(user_id: number, semester: string): Promise<TimetableModel> {
    return await TimetableModel.create({ user_id, semester });
  }

  async findOrCreateByUserAndSemester(user_id: number, semester: string): Promise<TimetableModel> {
    try {
      const [timetable] = await TimetableModel.findOrCreate({
        where: { user_id, semester },
        defaults: { user_id, semester },
      });
      return timetable;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const existing = await TimetableModel.findOne({
          where: { user_id, semester },
        });
        if (existing) return existing;
      }
      throw error;
    }
  }

  async findByIdAndUser(id: number, user_id: number): Promise<TimetableModel | null> {
    return await TimetableModel.findOne({
      where: { id, user_id },
    });
  }
}

export default new TimetableRepository();
