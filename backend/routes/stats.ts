import express, { Router } from "express";
import { getPlatformStats } from "../controllers/statsController";

const router: Router = express.Router();

router.get("/", getPlatformStats);

export default router;
