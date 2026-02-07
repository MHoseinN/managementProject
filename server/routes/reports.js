import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listProjectReports, submitReport, uploader } from '../controllers/reportController.js';

const router = express.Router();

// Student submits a report (after topic approval)
router.post('/', authMiddleware, uploader.single('file'), submitReport);

// Advisor/examiner/manager/student fetch reports for a project
router.get('/project/:projectId', authMiddleware, listProjectReports);

export default router;
