import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as projectCtrl from '../controllers/projectController.js';

const router = express.Router();

router.post('/enroll', authMiddleware, roleMiddleware('student'), projectCtrl.enrollProject);
router.post('/assign', authMiddleware, roleMiddleware('manager'), projectCtrl.assignAdvisorsExaminers);
router.post('/topics', authMiddleware, roleMiddleware('student'), projectCtrl.submitTopics);
router.post('/approve-topic', authMiddleware, roleMiddleware('teacher'), projectCtrl.approveTopic);
router.post('/grade', authMiddleware, roleMiddleware('teacher'), projectCtrl.submitGrade);

router.get('/student', authMiddleware, roleMiddleware('student'), projectCtrl.getStudentProjects);
router.get('/advisor', authMiddleware, roleMiddleware('teacher'), projectCtrl.getAdvisorProjects);
router.get('/examiner', authMiddleware, roleMiddleware('teacher'), projectCtrl.getExaminerProjects);

export default router;
