import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as msgCtrl from '../controllers/messageController.js';

const router = express.Router();

router.post('/send', authMiddleware, msgCtrl.sendMessage);
router.get('/', authMiddleware, msgCtrl.getMessages);
router.get('/project/:projectId', authMiddleware, msgCtrl.getProjectMessages);
router.post('/read', authMiddleware, msgCtrl.markAsRead);

export default router;
