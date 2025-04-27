import express, { Router } from 'express';
import { getAllInterests, toggleInterest } from '../controllers/interestController';
import { authenticateJWT, getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.post("/toggleInterest",getCookie,  toggleInterest);
router.get("/getAllInterests", authenticateJWT, getAllInterests);

export default router;