import ReactionPresetRepository from "../repositories/reactionPresetRepository";
import { ReactionPresetResponse } from "../types/reaction";

class ReactionService {
  async getActivePresets(): Promise<{ items: ReactionPresetResponse[] }> {
    const items = await ReactionPresetRepository.getActivePresets();
    return { items };
  }
}

export default new ReactionService();
