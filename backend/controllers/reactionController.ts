import { RequestHandler } from "express";
import ReactionService from "../services/reactionService";

export const getReactionPresets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const presets = await ReactionService.getActivePresets();
    res.status(200).json(presets);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
