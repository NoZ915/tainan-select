import express, { Router } from 'express';
import { getAllAcademies, getAllCourses, getAllDepartments, getCourse, getMostCuriousButUnreviewedCourses } from '../controllers/courseController';
import { getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.get("/getAllDepartments", getAllDepartments);
router.get("/getAllAcademies", getAllAcademies);
router.get("/:course_id", getCookie, getCourse);
router.get("/", getAllCourses);

// NOTE: 暫時移除此功能
router.get("/getMostCuriousButUnreviewedCourses", getMostCuriousButUnreviewedCourses);

export default router;