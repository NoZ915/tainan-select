import express, { Router } from 'express';
import { getAllCourses } from '../controllers/courseController';

const router: Router = express.Router();

router.get("/", getAllCourses);

export default router;