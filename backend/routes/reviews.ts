import express, { Router } from 'express';
import { getAllReviewsByCourseId } from '../controllers/reviewController';

const router: Router = express.Router();

router.get("/:course_id", getAllReviewsByCourseId);

export default router;