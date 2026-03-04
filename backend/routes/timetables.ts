import express, { Router } from "express";
import { authenticateJWT } from "../middlewares/authMiddleware";
import {
  addTimetableCourse,
  batchAddTimetableFromInterests,
  getAllAddedCourses,
  getOrCreateTimetable,
  removeTimetableCourse,
  swapTimetableCourse,
} from "../controllers/timetableController";

const router: Router = express.Router();

router.get("/", authenticateJWT, getOrCreateTimetable);
router.get("/items", authenticateJWT, getAllAddedCourses);
router.post("/:timetableId/items", authenticateJWT, addTimetableCourse);
router.post("/:timetableId/items/swap", authenticateJWT, swapTimetableCourse);
router.post("/:timetableId/items/batch-from-interests", authenticateJWT, batchAddTimetableFromInterests);
router.delete("/:timetableId/items/:courseId", authenticateJWT, removeTimetableCourse);

export default router;
