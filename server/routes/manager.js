import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as managerCtrl from '../controllers/managerController.js';

const router = express.Router();

router.post('/capacity', authMiddleware, roleMiddleware('manager'), managerCtrl.setCapacity);
router.get('/projects', authMiddleware, roleMiddleware('manager'), managerCtrl.getManagerProjects);
router.post('/grade', authMiddleware, roleMiddleware('manager'), managerCtrl.submitGrade);

export default router;
