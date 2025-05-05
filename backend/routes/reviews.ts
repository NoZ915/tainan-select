import express, { Router } from 'express';
import { upsertReview, getAllReviewsByCourseId, deleteReview, getLatestReviews, getAllReviewsByUserId } from '../controllers/reviewController';
import { authenticateJWT, getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.get("/getLatestReviews", getCookie, getLatestReviews);
router.get("/getAllReviewsByUserId", authenticateJWT, getAllReviewsByUserId);
router.get("/:course_id", getCookie, getAllReviewsByCourseId);
router.post("/upsertReview", authenticateJWT, upsertReview);
router.delete("/:review_id", authenticateJWT, deleteReview);


export default router;