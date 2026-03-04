import TimetableItemModel from "../models/TimetableItem";
import CourseModel from "../models/Course";
import TimetableModel from "../models/Timetable";
import { Transaction } from "sequelize";

class TimetableItemRepository {
  async findByTimetableAndCourse(
    timetable_id: number,
    course_id: number,
    transaction?: Transaction
  ): Promise<TimetableItemModel | null> {
    return await TimetableItemModel.findOne({
      where: { timetable_id, course_id },
      transaction,
    });
  }

  async addCourse(timetable_id: number, course_id: number, transaction?: Transaction): Promise<TimetableItemModel> {
    return await TimetableItemModel.create({ timetable_id, course_id }, { transaction });
  }

  async removeCourse(timetable_id: number, course_id: number, transaction?: Transaction): Promise<void> {
    await TimetableItemModel.destroy({
      where: { timetable_id, course_id },
      transaction,
    });
  }

  async getAllByTimetableId(timetable_id: number, transaction?: Transaction): Promise<TimetableItemModel[]> {
    return await TimetableItemModel.findAll({
      where: { timetable_id },
      transaction,
      include: [
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "semester", "instructor", "course_room"],
        },
      ],
      order: [["created_at", "ASC"]],
    });
  }

  async getAllByUserId(user_id: number): Promise<TimetableItemModel[]> {
    return await TimetableItemModel.findAll({
      include: [
        {
          model: TimetableModel,
          as: "timetable",
          attributes: ["id", "semester", "user_id"],
          where: { user_id },
        },
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "semester", "instructor", "course_time", "course_room"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }
}

export default new TimetableItemRepository();
