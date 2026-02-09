import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as defenseCtrl from '../controllers/defenseController.js';

const router = express.Router();

router.post('/slots', authMiddleware, roleMiddleware('teacher'), defenseCtrl.submitDefenseSlots);
router.get('/slots', authMiddleware, defenseCtrl.getDefenseSlotsForTerm);
router.get('/slots/examiner', authMiddleware, roleMiddleware('teacher'), defenseCtrl.getExaminerSlots);
router.get('/slot-requirements', authMiddleware, roleMiddleware('teacher'), defenseCtrl.getSlotRequirements);
router.get('/capacity-details', authMiddleware, defenseCtrl.getCapacityDetails);
router.get('/test-capacity', authMiddleware, roleMiddleware('teacher'), defenseCtrl.testCapacityStatus);
router.get('/debug-user', authMiddleware, defenseCtrl.debugUserInfo);
router.post('/schedule', authMiddleware, roleMiddleware('manager'), defenseCtrl.scheduleDefense);

export default router;
