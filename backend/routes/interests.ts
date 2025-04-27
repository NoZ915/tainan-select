import express, { Router } from 'express';
import { addInterest } from '../controllers/interestController';

const router: Router = express.Router();

router.post("/addInterest", addInterest);

export default router;