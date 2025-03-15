import express, { Router } from 'express';
import { getAllAcademies, getAllCourses, getAllDepartments } from '../controllers/courseController';

const router: Router = express.Router();

router.get("/", getAllCourses);
router.get("/getAllDepartments", getAllDepartments);
router.get("/getAllAcademies", getAllAcademies);

export default router;