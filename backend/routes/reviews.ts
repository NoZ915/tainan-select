import express, { Router } from 'express';
import { createReview, getAllReviewsByCourseId } from '../controllers/reviewController';
import { authenticateJWT, getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.get("/:course_id", getCookie, getAllReviewsByCourseId);
router.post("/createReview", authenticateJWT, createReview);

export default router;