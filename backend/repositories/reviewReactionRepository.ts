import { Op, Transaction } from "sequelize";
import ReactionPresetModel from "../models/ReactionPreset";
import ReviewReactionModel from "../models/ReviewReaction";
import { ReviewReactionSummary } from "../types/reaction";

type RawReactionRow = {
  review_id: number;
  ["preset.key"]: string;
};

class ReviewReactionRepository {
  async addReaction(review_id: number, user_id: number, preset_id: number, transaction: Transaction): Promise<void> {
    await ReviewReactionModel.create(
      { review_id, user_id, preset_id },
      { transaction }
    );
  }

  async removeReaction(review_id: number, user_id: number, preset_id: number, transaction: Transaction): Promise<void> {
    await ReviewReactionModel.destroy({
      where: { review_id, user_id, preset_id },
      transaction
    });
  }

  async getCountsByReviewId(review_id: number): Promise<Record<string, number>> {
    const reactions = await ReviewReactionModel.findAll({
      where: { review_id },
      attributes: ["review_id"],
      include: [
        {
          model: ReactionPresetModel,
          as: "preset",
          attributes: ["key"],
        }
      ],
      raw: true
    });

    const counts: Record<string, number> = {};
    for (const reaction of reactions as unknown as RawReactionRow[]) {
      const key = reaction["preset.key"];
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  async getMyReactionKeysByReviewId(review_id: number, user_id: number): Promise<string[]> {
    const reactions = await ReviewReactionModel.findAll({
      where: { review_id, user_id },
      attributes: ["review_id"],
      include: [
        {
          model: ReactionPresetModel,
          as: "preset",
          attributes: ["key"],
        }
      ],
      raw: true
    });

    const keySet = new Set<string>();
    for (const reaction of reactions as unknown as RawReactionRow[]) {
      keySet.add(reaction["preset.key"]);
    }
    return Array.from(keySet);
  }

  async getReactionSummaryByReviewIds(review_ids: number[], user_id?: number): Promise<Map<number, ReviewReactionSummary>> {
    const summaryMap = new Map<number, ReviewReactionSummary>();
    if (review_ids.length === 0) return summaryMap;

    const reactions = await ReviewReactionModel.findAll({
      where: {
        review_id: { [Op.in]: review_ids }
      },
      attributes: ["review_id"],
      include: [
        {
          model: ReactionPresetModel,
          as: "preset",
          attributes: ["key"],
        }
      ],
      raw: true
    });

    for (const reaction of reactions as unknown as RawReactionRow[]) {
      const reviewId = reaction.review_id;
      const key = reaction["preset.key"];
      const summary = summaryMap.get(reviewId) || { counts: {}, myReactions: [] };
      summary.counts[key] = (summary.counts[key] || 0) + 1;
      summaryMap.set(reviewId, summary);
    }

    if (user_id === undefined) {
      return summaryMap;
    }

    const myReactions = await ReviewReactionModel.findAll({
      where: {
        review_id: { [Op.in]: review_ids },
        user_id
      },
      attributes: ["review_id"],
      include: [
        {
          model: ReactionPresetModel,
          as: "preset",
          attributes: ["key"],
        }
      ],
      raw: true
    });

    for (const reaction of myReactions as unknown as RawReactionRow[]) {
      const reviewId = reaction.review_id;
      const key = reaction["preset.key"];
      const summary = summaryMap.get(reviewId) || { counts: {}, myReactions: [] };
      if (!summary.myReactions.includes(key)) {
        summary.myReactions.push(key);
      }
      summaryMap.set(reviewId, summary);
    }

    return summaryMap;
  }
}

export default new ReviewReactionRepository();
