import express, { Router } from "express";
import {
  createFeatureRequest,
  deleteFeatureRequest,
  getFeatureRequests,
  toggleFeatureRequestVote,
  updateFeatureRequestAdminReply,
  updateFeatureRequestStatus,
} from "../controllers/featureRequestController";
import { authenticateJWT, getCookie } from "../middlewares/authMiddleware";
import { authenticateAdmin } from "../middlewares/adminMiddleware";

const router: Router = express.Router();

router.get("/", getCookie, getFeatureRequests);
router.post("/", authenticateJWT, createFeatureRequest);
router.post("/:id/vote", authenticateJWT, toggleFeatureRequestVote);
router.patch("/:id/status", authenticateJWT, authenticateAdmin, updateFeatureRequestStatus);
router.patch("/:id/reply", authenticateJWT, authenticateAdmin, updateFeatureRequestAdminReply);
router.delete("/:id", authenticateJWT, deleteFeatureRequest);

export default router;