import { RequestHandler, Response } from "express";
import TimetableAnalyticsService, {
  TimetableAnalyticsServiceError,
} from "../services/timetableAnalyticsService";

const handleTimetableAnalyticsError = (res: Response, error: unknown): void => {
  if (error instanceof TimetableAnalyticsServiceError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "匿名課表統計同步失敗" });
};

export const syncGuestTimetableSnapshot: RequestHandler = async (req, res): Promise<void> => {
  try {
    await TimetableAnalyticsService.syncGuestSnapshot(req.body);
    res.status(204).send();
  } catch (error) {
    handleTimetableAnalyticsError(res, error);
  }
};

export const deleteGuestTimetableSnapshot: RequestHandler = async (req, res): Promise<void> => {
  try {
    await TimetableAnalyticsService.deleteGuestSnapshot(req.body);
    res.status(204).send();
  } catch (error) {
    handleTimetableAnalyticsError(res, error);
  }
};
