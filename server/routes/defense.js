import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as defenseCtrl from '../controllers/defenseController.js';

const router = express.Router();

router.post('/slots', authMiddleware, roleMiddleware('teacher'), defenseCtrl.submitDefenseSlots);
router.get('/slots', authMiddleware, roleMiddleware('teacher'), defenseCtrl.getExaminerSlots);
router.post('/schedule', authMiddleware, roleMiddleware('manager'), defenseCtrl.scheduleDefense);

export default router;
