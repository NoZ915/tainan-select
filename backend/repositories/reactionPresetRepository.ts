import { Transaction } from "sequelize";
import ReactionPresetModel from "../models/ReactionPreset";
import { ReactionPresetResponse } from "../types/reaction";

class ReactionPresetRepository {
  async getActivePresets(): Promise<ReactionPresetResponse[]> {
    const presets = await ReactionPresetModel.findAll({
      where: { is_active: true },
      attributes: ["key", "label", "type", "unicode", "image_path", "sort_order"],
      order: [["sort_order", "ASC"], ["id", "ASC"]],
    });

    return presets.map((preset) => ({
      key: preset.key,
      label: preset.label,
      type: preset.type,
      unicode: preset.unicode,
      imagePath: preset.image_path,
      sortOrder: preset.sort_order,
    }));
  }

  async findPresetByKey(key: string, transaction?: Transaction): Promise<ReactionPresetModel | null> {
    return await ReactionPresetModel.findOne({
      where: { key },
      transaction,
    });
  }
}

export default new ReactionPresetRepository();
