import express, { Router } from 'express';
import { createReview, getAllReviewsByCourseId } from '../controllers/reviewController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.get("/:course_id", getAllReviewsByCourseId);
router.post("/createReview", authenticateJWT, createReview);

export default router;