import { UniqueConstraintError } from "sequelize";
import db from "../models";
import FeatureRequestRepository from "../repositories/featureRequestRepository";
import {
  FEATURE_REQUEST_STATUSES,
  FeatureRequestResponse,
  FeatureRequestStatus,
  ToggleFeatureRequestVoteResult,
} from "../types/featureRequest";

const MAX_CONTENT_LENGTH = 500;
const MAX_ADMIN_REPLY_LENGTH = 500;

class FeatureRequestService {
  async getAll(
    status: FeatureRequestStatus | undefined,
    user_id: number | undefined
  ): Promise<FeatureRequestResponse[]> {
    const featureRequests = await FeatureRequestRepository.getAll(status);
    const votedIds = user_id !== undefined
      ? await FeatureRequestRepository.getVotedIdsByUser(featureRequests.map((item) => item.id), user_id)
      : new Set<number>();

    return featureRequests.map((featureRequest) => {
      const { user_id: ownerId, ...rest } = featureRequest.toJSON();
      return {
        ...rest,
        is_owner: ownerId === user_id,
        has_voted: votedIds.has(rest.id),
      } as FeatureRequestResponse;
    });
  }

  async create(user_id: number, content: string): Promise<void> {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error("EMPTY_CONTENT");
    }
    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      throw new Error("CONTENT_TOO_LONG");
    }

    await FeatureRequestRepository.create(user_id, trimmedContent);
  }

  async toggleVote(feature_request_id: number, user_id: number): Promise<ToggleFeatureRequestVoteResult> {
    const transaction = await db.sequelize.transaction();

    try {
      const featureRequest = await FeatureRequestRepository.findById(feature_request_id, transaction);
      if (!featureRequest) {
        throw new Error("FEATURE_REQUEST_NOT_FOUND");
      }

      const existingVote = await FeatureRequestRepository.findVote(feature_request_id, user_id, transaction);
      let has_voted: boolean;

      if (existingVote) {
        await FeatureRequestRepository.removeVote(feature_request_id, user_id, transaction);
        await FeatureRequestRepository.decrementVoteCount(feature_request_id, transaction);
        has_voted = false;
      } else {
        await FeatureRequestRepository.addVote(feature_request_id, user_id, transaction);
        await FeatureRequestRepository.incrementVoteCount(feature_request_id, transaction);
        has_voted = true;
      }

      await transaction.commit();

      const updated = await FeatureRequestRepository.findById(feature_request_id);
      return { has_voted, vote_count: updated?.vote_count ?? 0 };
    } catch (err) {
      await transaction.rollback();

      if (err instanceof UniqueConstraintError) {
        const updated = await FeatureRequestRepository.findById(feature_request_id);
        return { has_voted: true, vote_count: updated?.vote_count ?? 0 };
      }

      throw err;
    }
  }

  async updateAdminReply(feature_request_id: number, adminReply: string): Promise<void> {
    const trimmed = adminReply.trim();
    if (trimmed.length > MAX_ADMIN_REPLY_LENGTH) {
      throw new Error("ADMIN_REPLY_TOO_LONG");
    }

    const updatedCount = await FeatureRequestRepository.updateAdminReply(
      feature_request_id,
      trimmed.length > 0 ? trimmed : null
    );
    if (updatedCount === 0) {
      throw new Error("FEATURE_REQUEST_NOT_FOUND");
    }
  }

  async updateStatus(feature_request_id: number, status: string): Promise<void> {
    if (!FEATURE_REQUEST_STATUSES.includes(status as FeatureRequestStatus)) {
      throw new Error("INVALID_STATUS");
    }

    const updatedCount = await FeatureRequestRepository.updateStatus(
      feature_request_id,
      status as FeatureRequestStatus
    );
    if (updatedCount === 0) {
      throw new Error("FEATURE_REQUEST_NOT_FOUND");
    }
  }

  async remove(feature_request_id: number, user_id: number, isAdmin: boolean): Promise<void> {
    const featureRequest = await FeatureRequestRepository.findById(feature_request_id);
    if (!featureRequest) {
      throw new Error("FEATURE_REQUEST_NOT_FOUND");
    }

    if (!isAdmin && featureRequest.user_id !== user_id) {
      throw new Error("FORBIDDEN");
    }

    await FeatureRequestRepository.destroy(feature_request_id);
  }
}

export default new FeatureRequestService();