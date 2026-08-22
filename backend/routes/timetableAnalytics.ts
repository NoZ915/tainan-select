import express, { Router } from "express";
import {
  deleteGuestTimetableSnapshot,
  syncGuestTimetableSnapshot,
} from "../controllers/guestTimetableSnapshotController";

const router: Router = express.Router();

router.put("/guest-snapshot", syncGuestTimetableSnapshot);
router.delete("/guest-snapshot", deleteGuestTimetableSnapshot);

export default router;
