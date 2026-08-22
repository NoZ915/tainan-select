import express, { Router } from "express";
import {
  deleteGuestTimetableSnapshot,
  syncGuestTimetableSnapshot,
} from "../controllers/guestTimetableSnapshotController";
import { GUEST_TIMETABLE_SNAPSHOT_CONFIG } from "../config/guestTimetableSnapshot";
import { createFixedWindowRateLimiter } from "../utils/fixedWindowRateLimiter";

const router: Router = express.Router();
const isGuestSnapshotWriteRateLimited = createFixedWindowRateLimiter({
  windowMs: GUEST_TIMETABLE_SNAPSHOT_CONFIG.rateLimitWindowMs,
  maxRequests: GUEST_TIMETABLE_SNAPSHOT_CONFIG.rateLimitMaxRequests,
  maxSources: GUEST_TIMETABLE_SNAPSHOT_CONFIG.rateLimitMaxSources,
});

export const limitGuestSnapshotWrites: express.RequestHandler = (req, res, next) => {
  const source = req.ip || req.socket.remoteAddress || "unknown";
  if (isGuestSnapshotWriteRateLimited(source)) {
    res.status(429).json({ message: "同步要求過於頻繁，請稍後再試" });
    return;
  }
  next();
};

router.put("/guest-snapshot", limitGuestSnapshotWrites, syncGuestTimetableSnapshot);
router.delete("/guest-snapshot", limitGuestSnapshotWrites, deleteGuestTimetableSnapshot);

export default router;
