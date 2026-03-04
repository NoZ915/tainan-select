import TimetableItemModel from "../models/TimetableItem";
import CourseModel from "../models/Course";
import TimetableModel from "../models/Timetable";

class TimetableItemRepository {
  async findByTimetableAndCourse(timetable_id: number, course_id: number): Promise<TimetableItemModel | null> {
    return await TimetableItemModel.findOne({
      where: { timetable_id, course_id },
    });
  }

  async addCourse(timetable_id: number, course_id: number): Promise<TimetableItemModel> {
    return await TimetableItemModel.create({ timetable_id, course_id });
  }

  async removeCourse(timetable_id: number, course_id: number): Promise<void> {
    await TimetableItemModel.destroy({
      where: { timetable_id, course_id },
    });
  }

  async getAllByTimetableId(timetable_id: number): Promise<TimetableItemModel[]> {
    return await TimetableItemModel.findAll({
      where: { timetable_id },
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
