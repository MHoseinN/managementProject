import express from 'express';
import { register, login, adminApprove, adminReject, getPendingUsers, getApprovedUsers, getAllUsers } from '../controllers/authController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/pending', authMiddleware, roleMiddleware('admin'), getPendingUsers);
router.post('/approve', authMiddleware, roleMiddleware('admin'), adminApprove);
router.post('/reject', authMiddleware, roleMiddleware('admin'), adminReject);
router.get('/approved', authMiddleware, roleMiddleware('admin'), getApprovedUsers);
router.get('/all-users', authMiddleware, roleMiddleware('admin'), getAllUsers);

export default router;
