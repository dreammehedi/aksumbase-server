import { createError } from '../utils/error.js';
import prisma from '../lib/prisma.js';

export const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    // Check if user exists and is an admin
    if (!user || user.role !== 'admin') {
      return next(createError(403, 'You are not authorized to access this resource'));
    }
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    next(createError(500, 'Error verifying admin status'));
  }
}; 