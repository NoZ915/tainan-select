import express, { Router } from 'express';
import { toggleInterest } from '../controllers/interestController';
import { getCookie } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.post("/toggleInterest",getCookie,  toggleInterest);

export default router;