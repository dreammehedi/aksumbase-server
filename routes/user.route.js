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
import { verifyAdminOld } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/me", verifyToken, getCurrentUser);

// Protected routes
router.get("/dashboard", verifyToken, verifyAdminOld, getDashboardStats);
router.get("/", verifyToken, verifyAdminOld, getUser);
router.get("/:id", verifyToken, verifyAdminOld, getUserById);
router.put("/:id", verifyToken, verifyAdminOld, updateUser);
router.put("/:id/role", verifyToken, verifyAdminOld, updateUserRole);
router.delete("/:id", verifyToken, verifyAdminOld, deleteUser);

export default router;
