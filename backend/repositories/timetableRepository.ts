import TimetableModel from "../models/Timetable";

class TimetableRepository {
  async findByUserAndSemester(user_id: number, semester: string): Promise<TimetableModel | null> {
    return await TimetableModel.findOne({
      where: { user_id, semester },
    });
  }

  async create(user_id: number, semester: string): Promise<TimetableModel> {
    return await TimetableModel.create({ user_id, semester });
  }

  async findByIdAndUser(id: number, user_id: number): Promise<TimetableModel | null> {
    return await TimetableModel.findOne({
      where: { id, user_id },
    });
  }
}

export default new TimetableRepository();
