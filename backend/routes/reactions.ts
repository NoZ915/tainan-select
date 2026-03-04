import express, { Router } from "express";
import { getReactionPresets } from "../controllers/reactionController";

const router: Router = express.Router();

router.get("/presets", getReactionPresets);

export default router;
