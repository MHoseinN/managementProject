import express from 'express';
import { register, login, adminApprove, getPendingUsers } from '../controllers/authController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/pending', authMiddleware, roleMiddleware('admin'), getPendingUsers);
router.post('/approve', authMiddleware, roleMiddleware('admin'), adminApprove);

export default router;
