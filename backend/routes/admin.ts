import express, { Router } from "express";
import {
  deleteRelatedPostImport,
  deleteRelatedPost,
  getAdminStatus,
  getRelatedPostOverview,
  importDcardSource,
  previewImportDcardSource,
  syncRelatedPostsFromGoogle,
} from "../controllers/adminController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { authenticateAdmin } from "../middlewares/adminMiddleware";

const router: Router = express.Router();

router.get("/status", authenticateJWT, getAdminStatus);
router.get("/related-posts/overview", authenticateJWT, authenticateAdmin, getRelatedPostOverview);
router.post("/related-posts/import-dcard-source-preview", authenticateJWT, authenticateAdmin, previewImportDcardSource);
router.post("/related-posts/import-dcard-source", authenticateJWT, authenticateAdmin, importDcardSource);
router.post("/related-posts/google-sync", authenticateJWT, authenticateAdmin, syncRelatedPostsFromGoogle);
router.delete("/related-posts/:id", authenticateJWT, authenticateAdmin, deleteRelatedPost);
router.delete("/related-post-imports/:id", authenticateJWT, authenticateAdmin, deleteRelatedPostImport);

export default router;
