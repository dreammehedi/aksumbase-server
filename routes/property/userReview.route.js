import express from "express";
import { upload } from "../../config/upload.js";

import {
  addReview,
  deleteReview,
  deleteReviewByAdmin,
  getReviewsGivenByUser,
  getReviewsReceivedByUser,
  getUserReviews,
  updateReview,
} from "../../controllers/property/userReview.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const UserReviewRouter = express.Router();

// 👉 Create Review
UserReviewRouter.post("/user/review", verifyToken, upload.none(), addReview);

// 👉 Update Review
UserReviewRouter.put("/user/review", verifyToken, upload.none(), updateReview);

// 👉 Delete Review
UserReviewRouter.delete(
  "/user/review/:id",
  verifyToken,
  // verifyAdminOld,
  deleteReview
);

// 👉 Delete Review By Admin
UserReviewRouter.delete(
  "/admin/review/:id",
  verifyToken,
  verifyAdminOld,
  deleteReviewByAdmin
);

// 👉 Get all reviews (optional query: ?targetUserId=xyz)
UserReviewRouter.get("/user/review", paginationMiddleware, getUserReviews);

// 👉 NEW: Get all reviews sent (written) by the logged-in user
UserReviewRouter.get(
  "/user/review/given",
  verifyToken,
  paginationMiddleware,
  getReviewsGivenByUser
);

// 👉 NEW: Get all reviews received by the logged-in user
UserReviewRouter.get(
  "/user/review/received",
  verifyToken,
  paginationMiddleware,
  getReviewsReceivedByUser
);

export default UserReviewRouter;
