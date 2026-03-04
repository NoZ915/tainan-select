import { UniqueConstraintError } from "sequelize";
import db from "../models";
import ReactionPresetRepository from "../repositories/reactionPresetRepository";
import ReviewRepository from "../repositories/reviewRepository";
import ReviewReactionRepository from "../repositories/reviewReactionRepository";
import { ReviewReactionSummary, ToggleReviewReactionResult } from "../types/reaction";

class ReviewReactionService {
  async getReviewReactions(review_id: number, user_id?: number): Promise<{ reviewId: number; counts: Record<string, number>; myReactions: string[] }> {
    await ReviewRepository.ensureReviewExists(review_id);

    const counts = await ReviewReactionRepository.getCountsByReviewId(review_id);
    const myReactions = user_id !== undefined
      ? await ReviewReactionRepository.getMyReactionKeysByReviewId(review_id, user_id)
      : [];

    return {
      reviewId: review_id,
      counts,
      myReactions,
    };
  }

  async toggleReaction(review_id: number, user_id: number, key: string): Promise<ToggleReviewReactionResult> {
    const transaction = await db.sequelize.transaction();

    try {
      await ReviewRepository.getReviewByIdForReaction(review_id, transaction);

      const preset = await ReactionPresetRepository.findPresetByKey(key, transaction);
      if (!preset) {
        throw new Error("REACTION_PRESET_NOT_FOUND");
      }
      if (!preset.is_active) {
        throw new Error("REACTION_PRESET_INACTIVE");
      }

      let action: "added" | "removed" = "added";

      try {
        await ReviewReactionRepository.addReaction(review_id, user_id, preset.id, transaction);
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          await ReviewReactionRepository.removeReaction(review_id, user_id, preset.id, transaction);
          action = "removed";
        } else {
          throw err;
        }
      }

      await transaction.commit();
      const counts = await ReviewReactionRepository.getCountsByReviewId(review_id);

      return {
        reviewId: review_id,
        key,
        action,
        counts,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getReactionSummaryByReviewIds(review_ids: number[], user_id?: number): Promise<Map<number, ReviewReactionSummary>> {
    return await ReviewReactionRepository.getReactionSummaryByReviewIds(review_ids, user_id);
  }
}

export default new ReviewReactionService();
