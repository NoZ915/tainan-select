import express, { Router } from 'express';
import { getAllAcademies, getAllCourses, getAllDepartments, getCourse } from '../controllers/courseController';

const router: Router = express.Router();

router.get("/", getAllCourses);
router.get("/course/:course_id", getCourse);
router.get("/getAllDepartments", getAllDepartments);
router.get("/getAllAcademies", getAllAcademies);

export default router;