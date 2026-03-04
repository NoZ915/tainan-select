import { RequestHandler } from "express";
import StatsService from "../services/statsService";

export const getPlatformStats: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const stats = await StatsService.getPlatformStats();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
