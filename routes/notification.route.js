import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.put('/read-all', verifyToken, markAllAsRead);
router.delete('/:id', verifyToken, deleteNotification);

export default router;