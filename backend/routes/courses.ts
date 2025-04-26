import express, { Router } from 'express';
import { AddViewCount, getAllAcademies, getAllCourses, getAllDepartments, getCourse, getMostCuriousButUnreviewedCourses } from '../controllers/courseController';
import { getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.post("/addViewCount", AddViewCount);
router.get("/getAllDepartments", getAllDepartments);
router.get("/getAllAcademies", getAllAcademies);
router.get("/getMostCuriousButUnreviewedCourses", getMostCuriousButUnreviewedCourses);
router.get("/:course_id",getCookie, getCourse);
router.get("/", getAllCourses);

export default router;