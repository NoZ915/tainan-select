import CourseScheduleModel from "../models/CourseSchedule";

class CourseScheduleRepository {
  async getByCourseId(course_id: number): Promise<CourseScheduleModel[]> {
    return await CourseScheduleModel.findAll({
      where: { course_id },
      order: [["day", "ASC"], ["start_period", "ASC"]],
    });
  }

  async getByCourseIds(courseIds: number[]): Promise<CourseScheduleModel[]> {
    if (courseIds.length === 0) return [];
    return await CourseScheduleModel.findAll({
      where: { course_id: courseIds },
      order: [["course_id", "ASC"], ["day", "ASC"], ["start_period", "ASC"]],
    });
  }
}

export default new CourseScheduleRepository();
