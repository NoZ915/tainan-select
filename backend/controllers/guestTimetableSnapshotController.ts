import { RequestHandler, Response } from "express";
import GuestTimetableSnapshotService, {
  GuestTimetableSnapshotServiceError,
} from "../services/guestTimetableSnapshotService";

const handleGuestTimetableSnapshotError = (res: Response, error: unknown): void => {
  if (error instanceof GuestTimetableSnapshotServiceError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "匿名課表統計同步失敗" });
};

export const syncGuestTimetableSnapshot: RequestHandler = async (req, res): Promise<void> => {
  try {
    await GuestTimetableSnapshotService.syncGuestSnapshot(req.body);
    res.status(204).send();
  } catch (error) {
    handleGuestTimetableSnapshotError(res, error);
  }
};

export const deleteGuestTimetableSnapshot: RequestHandler = async (req, res): Promise<void> => {
  try {
    await GuestTimetableSnapshotService.deleteGuestSnapshot(req.body);
    res.status(204).send();
  } catch (error) {
    handleGuestTimetableSnapshotError(res, error);
  }
};
