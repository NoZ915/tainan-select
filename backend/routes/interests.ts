import express, { Router } from 'express';
import { getAllInterests, toggleInterest } from '../controllers/interestController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.post("/toggleInterest", authenticateJWT, toggleInterest);
router.get("/getAllInterests", authenticateJWT, getAllInterests);

export default router;
