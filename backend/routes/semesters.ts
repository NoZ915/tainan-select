import express, { Router } from "express";
import { getAllSemesters } from "../controllers/semesterController";

const router: Router = express.Router();

router.get("/", getAllSemesters);

export default router;
