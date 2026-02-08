import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as managerCtrl from '../controllers/managerController.js';
import * as scheduleCtrl from '../controllers/scheduleController.js';

const router = express.Router();

router.post('/capacity', authMiddleware, roleMiddleware('manager'), managerCtrl.setCapacity);
router.get('/capacity', authMiddleware, roleMiddleware('manager'), managerCtrl.getCapacity);
router.get('/teachers', authMiddleware, roleMiddleware('manager'), managerCtrl.listMajorTeachers);
router.get('/projects', authMiddleware, roleMiddleware('manager'), managerCtrl.getManagerProjects);
router.get('/pending-enrollments', authMiddleware, roleMiddleware('manager'), managerCtrl.listPendingEnrollments);
router.post('/approve-enrollment', authMiddleware, roleMiddleware('manager'), managerCtrl.approveEnrollment);
router.post('/schedule-unscheduled', authMiddleware, roleMiddleware('manager'), managerCtrl.scheduleUnscheduledProjects);
router.post('/schedule-defense', authMiddleware, roleMiddleware('manager'), managerCtrl.scheduleDefense);
router.post('/schedule-defenses', authMiddleware, roleMiddleware('manager'), scheduleCtrl.scheduleDefenses);
router.post('/reschedule-defense', authMiddleware, roleMiddleware('manager'), managerCtrl.rescheduleDefense);
router.post('/grade', authMiddleware, roleMiddleware('manager'), managerCtrl.submitGrade);

export default router;
