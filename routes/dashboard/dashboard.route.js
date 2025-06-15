import express from "express";
import {
  getAdminDashboardOverview,
  getAllProperty,
  getAllUsersByAdmin,
  getAllUsersSessionByAdmin,
  updateMultiplePropertyStatus,
  userRequestTour,
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

DashboardRouter.get(
  "/admin/all-users-session",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllUsersSessionByAdmin
);

DashboardRouter.get(
  "/admin/all-property",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllProperty
);

DashboardRouter.put(
  "/admin/property/update-status",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  updateMultiplePropertyStatus
);

DashboardRouter.get(
  "/admin/property/tour-request",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  userRequestTour
);

export default DashboardRouter;
