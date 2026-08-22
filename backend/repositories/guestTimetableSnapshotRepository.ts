import { Op, Transaction } from "sequelize";
import GuestTimetableSnapshotModel from "../models/GuestTimetableSnapshot";

class GuestTimetableSnapshotRepository {
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

export default new GuestTimetableSnapshotRepository();
