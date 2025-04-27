import express, { Router } from 'express';
import { toggleInterest } from '../controllers/interestController';

const router: Router = express.Router();

router.post("/toggleInterest", toggleInterest);

export default router;