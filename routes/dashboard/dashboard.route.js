import express from "express";
import { upload } from "../../config/upload.js";
import {
  adminRequestPropertyContactUser,
  getAdminDashboardOverview,
  getAllProperty,
  getAllUserRoleApplications,
  getAllUsersByAdmin,
  getAllUsersSessionByAdmin,
  getPropertyByUser,
  getUserRecentActivity,
  getUserReviews,
  getUserRolePackagePurchase,
  getUsersByRole,
  getUserSession,
  renewRole,
  updateMultiplePropertyStatus,
  userRequestPropertyContactUser,
  userRequestTour,
} from "../../controllers/dashboard/dashboard.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const DashboardRouter = express.Router();

// admin route
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

DashboardRouter.get("/user/users-session", verifyToken, getUserSession);

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

DashboardRouter.get(
  "/admin/property/contact-user",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  adminRequestPropertyContactUser
);

DashboardRouter.get(
  "/admin/role-applications",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllUserRoleApplications
);

// user route
DashboardRouter.get(
  "/user/role-package-purchase",
  verifyToken,
  getUserRolePackagePurchase
);

DashboardRouter.get(
  "/user/property",
  verifyToken,
  paginationMiddleware,
  getPropertyByUser
);

DashboardRouter.post("/user/role-renew", verifyToken, upload.none(), renewRole);

DashboardRouter.get(
  "/user/property/contact-user",
  verifyToken,
  paginationMiddleware,
  userRequestPropertyContactUser
);

// Get all reviews by the logged-in user
DashboardRouter.get(
  "/user/property/reviews",
  verifyToken,
  paginationMiddleware,
  getUserReviews
);

DashboardRouter.get(
  "/user/property/tour-request",
  verifyToken,
  paginationMiddleware,
  userRequestTour
);

DashboardRouter.get(
  "/user/recent-activity",
  verifyToken,
  getUserRecentActivity
);

DashboardRouter.get("/user/by-role", getUsersByRole);
export default DashboardRouter;
