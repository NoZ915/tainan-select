import express, { Router } from 'express';
import { getAllCourses } from '../controllers/courseController';

const router: Router = express.Router();

router.get("/:course_id", getAllCourses);

export default router;