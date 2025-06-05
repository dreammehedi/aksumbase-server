import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import { 
  getUser, 
  getUserById, 
  updateUser, 
  deleteUser, 
  updateUserRole,
  getCurrentUser,
  getDashboardStats 
} from '../controllers/user.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 2MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};

// Public routes
router.get('/me', verifyToken, getCurrentUser);

// Protected routes
router.get('/dashboard', verifyToken, verifyAdmin, getDashboardStats);
router.get('/', verifyToken, verifyAdmin, getUser);
router.get('/:id', verifyToken, verifyAdmin, getUserById);
router.put('/:id', verifyToken, verifyAdmin, updateUser);
router.put('/:id/role', verifyToken, verifyAdmin, updateUserRole);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

export default router;