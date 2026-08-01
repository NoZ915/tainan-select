import { Op, Transaction } from "sequelize";
import FeatureRequestModel from "../models/FeatureRequest";
import FeatureRequestVoteModel from "../models/FeatureRequestVote";
import UserModel from "../models/Users";
import { FeatureRequestStatus } from "../types/featureRequest";

class FeatureRequestRepository {
  async getAll(status: FeatureRequestStatus | undefined): Promise<FeatureRequestModel[]> {
    return await FeatureRequestModel.findAll({
      where: status ? { status } : undefined,
      order: [["vote_count", "DESC"], ["created_at", "DESC"]],
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
      ],
    });
  }

  async findById(id: number, transaction?: Transaction, lockForUpdate = false): Promise<FeatureRequestModel | null> {
    return await FeatureRequestModel.findByPk(id, {
      transaction,
      lock: transaction && lockForUpdate ? transaction.LOCK.UPDATE : undefined,
    });
  }

  async create(user_id: number, content: string): Promise<FeatureRequestModel> {
    return await FeatureRequestModel.create({ user_id, content });
  }

  async destroy(id: number): Promise<number> {
    return await FeatureRequestModel.destroy({ where: { id } });
  }

  async updateStatus(id: number, status: FeatureRequestStatus): Promise<number> {
    const [count] = await FeatureRequestModel.update({ status }, { where: { id } });
    return count;
  }

  async updateAdminReply(id: number, admin_reply: string | null): Promise<number> {
    const [count] = await FeatureRequestModel.update({ admin_reply }, { where: { id } });
    return count;
  }

  async incrementVoteCount(id: number, transaction: Transaction): Promise<void> {
    await FeatureRequestModel.increment("vote_count", { by: 1, where: { id }, transaction });
  }

  async decrementVoteCount(id: number, transaction: Transaction): Promise<void> {
    await FeatureRequestModel.decrement("vote_count", { by: 1, where: { id }, transaction });
  }

  async findVote(
    feature_request_id: number,
    user_id: number,
    transaction: Transaction
  ): Promise<FeatureRequestVoteModel | null> {
    return await FeatureRequestVoteModel.findOne({
      where: { feature_request_id, user_id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  async addVote(feature_request_id: number, user_id: number, transaction: Transaction): Promise<void> {
    await FeatureRequestVoteModel.create({ feature_request_id, user_id }, { transaction });
  }

  async removeVote(feature_request_id: number, user_id: number, transaction: Transaction): Promise<number> {
    return await FeatureRequestVoteModel.destroy({
      where: { feature_request_id, user_id },
      transaction,
    });
  }

  async getVotedIdsByUser(feature_request_ids: number[], user_id: number): Promise<Set<number>> {
    if (feature_request_ids.length === 0) return new Set();

    const votes = await FeatureRequestVoteModel.findAll({
      where: {
        feature_request_id: { [Op.in]: feature_request_ids },
        user_id,
      },
      attributes: ["feature_request_id"],
      raw: true,
    });

    return new Set(votes.map((vote) => vote.feature_request_id));
  }
}

export default new FeatureRequestRepository();