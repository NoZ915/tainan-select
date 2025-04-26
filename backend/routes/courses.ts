import express, { Router } from 'express';
import { AddViewCount, getAllAcademies, getAllCourses, getAllDepartments, getCourse, getMostCuriousButUnreviewedCourses } from '../controllers/courseController';

const router: Router = express.Router();

router.patch("/addViewCount", AddViewCount);
router.get("/getAllDepartments", getAllDepartments);
router.get("/getAllAcademies", getAllAcademies);
router.get("/getMostCuriousButUnreviewedCourses", getMostCuriousButUnreviewedCourses);
router.get("/:course_id", getCourse);
router.get("/", getAllCourses);

export default router;