import { Op, Transaction } from "sequelize";
import CourseModel from "../models/Course";
import GuestTimetableSnapshotModel from "../models/GuestTimetableSnapshot";

class TimetableAnalyticsRepository {
  async findCoursesByIds(
    courseIds: number[],
    transaction: Transaction
  ): Promise<Array<{ id: number; semester: string }>> {
    if (courseIds.length === 0) return [];

    return await CourseModel.findAll({
      attributes: ["id", "semester"],
      where: { id: { [Op.in]: courseIds } },
      transaction,
      raw: true,
    });
  }

  async upsertSnapshot(
    clientId: string,
    semester: string,
    courseIds: number[],
    lastSyncedAt: Date,
    transaction: Transaction
  ): Promise<void> {
    await GuestTimetableSnapshotModel.upsert(
      {
        client_id: clientId,
        semester,
        course_ids: courseIds,
        last_synced_at: lastSyncedAt,
      },
      { transaction }
    );
  }

  async deleteMissingSemesters(
    clientId: string,
    activeSemesters: string[],
    transaction: Transaction
  ): Promise<number> {
    if (activeSemesters.length === 0) {
      return await this.deleteByClientId(clientId, transaction);
    }

    return await GuestTimetableSnapshotModel.destroy({
      where: {
        client_id: clientId,
        semester: { [Op.notIn]: activeSemesters },
      },
      transaction,
    });
  }

  async deleteByClientId(clientId: string, transaction: Transaction): Promise<number> {
    return await GuestTimetableSnapshotModel.destroy({
      where: { client_id: clientId },
      transaction,
    });
  }
}

export default new TimetableAnalyticsRepository();
