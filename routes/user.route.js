import express from "express";
import {
  deleteUser,
  getCurrentUser,
  getDashboardStats,
  getUser,
  getUserById,
  updateUser,
  updateUserRole,
} from "../controllers/user.controller.js";
import { verifyAdmin, verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/me", verifyToken, getCurrentUser);

// Protected routes
router.get("/dashboard", verifyToken, verifyAdmin, getDashboardStats);
router.get("/", verifyToken, verifyAdmin, getUser);
router.get("/:id", verifyToken, verifyAdmin, getUserById);
router.put("/:id", verifyToken, verifyAdmin, updateUser);
router.put("/:id/role", verifyToken, verifyAdmin, updateUserRole);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

export default router;
