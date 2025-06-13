import express from "express";
import {
  getAdminDashboardOverview,
  getAllUsersByAdmin,
} from "../../controllers/dashboard/dashboard.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const DashboardRouter = express.Router();

DashboardRouter.get(
  "/admin/dashboard",
  verifyToken,
  verifyAdminOld,
  getAdminDashboardOverview
);

DashboardRouter.get(
  "/admin/all-users",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllUsersByAdmin
);

export default DashboardRouter;
