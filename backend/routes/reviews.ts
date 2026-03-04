import express, { Router } from 'express';
import { upsertReview, getAllReviewsByCourseId, deleteReview, getLatestReviews, getAllReviewsByUserId, getReviewReactions, toggleReviewReaction } from '../controllers/reviewController';
import { authenticateJWT, getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.get("/getLatestReviews", getCookie, getLatestReviews);
router.get("/getAllReviewsByUserId", authenticateJWT, getAllReviewsByUserId);
router.get("/:course_id", getCookie, getAllReviewsByCourseId);
router.post("/upsertReview", authenticateJWT, upsertReview);
router.get("/:review_id/reactions", getCookie, getReviewReactions);
router.post("/:review_id/reactions/toggle", authenticateJWT, toggleReviewReaction);
router.delete("/:review_id", authenticateJWT, deleteReview);


export default router;
