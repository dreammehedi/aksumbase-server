import express from "express";
import { upload } from "../../config/upload.js";
import {
  adminRequestPropertyContactUser,
  deleteMySession,
  deleteUserSessionDataAdmin,
  getAdminAnalysisOverview,
  getAdminDashboardOverview,
  getAdminRolePackage,
  getAdminWeeklyReportOverview,
  getAllAdminsByAdmin,
  getAllProperty,
  getAllUserRoleApplications,
  getAllUsersByAdmin,
  getAllUsersSessionByAdmin,
  getPropertyByUser,
  getPropertyIsReadNotifications,
  getSingleUserProfile,
  getUserRecentActivity,
  getUserReviews,
  getUserRolePackagePurchase,
  getUsersByRole,
  getUserSession,
  getUserStatisticsOverview,
  renewRolePurchaseIntent,
  updateMultiplePropertyFlagged,
  updateMultiplePropertyStatus,
  updateMultiplePropertyTourStatus,
  updatePropertyIsRead,
  updatePropertyRentStatus,
  updatePropertySoldStatus,
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
  "/admin/analysis",
  verifyToken,
  verifyAdminOld,
  getAdminAnalysisOverview
);

DashboardRouter.get(
  "/admin/weekly-report",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAdminWeeklyReportOverview
);

DashboardRouter.get(
  "/admin/all-users",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllUsersByAdmin
);

DashboardRouter.get(
  "/admin/all-admin",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllAdminsByAdmin
);

DashboardRouter.get(
  "/admin/all-users-session",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllUsersSessionByAdmin
);

DashboardRouter.delete(
  "/admin/session/:id",
  verifyToken,
  verifyAdminOld,
  deleteUserSessionDataAdmin
);

DashboardRouter.delete("/user/session/:id", verifyToken, deleteMySession);

DashboardRouter.get(
  "/user/users-session",
  verifyToken,
  paginationMiddleware,
  getUserSession
);

DashboardRouter.get(
  "/admin/all-property",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllProperty
);

DashboardRouter.get(
  "/admin/property-is-read-notifications",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getPropertyIsReadNotifications
);

DashboardRouter.put(
  "/admin/property-is-read-notifications/update-read",
  verifyToken,
  verifyAdminOld,
  updatePropertyIsRead
);

DashboardRouter.put(
  "/admin/property/update-status",
  verifyToken,
  verifyAdminOld,
  updateMultiplePropertyStatus
);

DashboardRouter.put(
  "/user/property/update-tour-status",
  verifyToken,
  updateMultiplePropertyTourStatus
);

DashboardRouter.put(
  "/admin/property/update-flagged",
  verifyToken,
  verifyAdminOld,
  updateMultiplePropertyFlagged
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

DashboardRouter.get(
  "/admin/role-package",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAdminRolePackage
);

// user route
DashboardRouter.get("/user/role-package-purchase", getUserRolePackagePurchase);

DashboardRouter.get(
  "/user/property",
  verifyToken,
  paginationMiddleware,
  getPropertyByUser
);
DashboardRouter.put(
  "/user/property/update-sold",
  verifyToken,
  updatePropertySoldStatus
);

DashboardRouter.put(
  "/user/property/update-rent",
  verifyToken,
  updatePropertyRentStatus
);

DashboardRouter.post(
  "/user/role-renew-purchase-intent",
  verifyToken,
  upload.none(),
  renewRolePurchaseIntent
);

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

DashboardRouter.get("/user/statistics", verifyToken, getUserStatisticsOverview);
DashboardRouter.get("/user/by-role", paginationMiddleware, getUsersByRole);
DashboardRouter.get("/user/user-profile/:id", getSingleUserProfile);
export default DashboardRouter;
