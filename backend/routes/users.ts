import express, { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { updateUser } from '../controllers/userController';

const router: Router = express.Router();

router.patch("/updateUser", authenticateJWT, updateUser);

export default router;