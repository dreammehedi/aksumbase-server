import express from "express";
import { upload } from "../../config/upload.js";
import {
  addReview,
  deleteReview,
  getPropertyReviews,
  getUserReviews,
  updateReview,
} from "../../controllers/property/propertyReview.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyReviewRouter = express.Router();

// Create Review
PropertyReviewRouter.post(
  "/property/:propertyId/review",
  verifyToken,
  upload.none(),
  addReview
);

// Update Review
PropertyReviewRouter.put(
  "/property/:propertyId/review/:reviewId",
  verifyToken,
  upload.none(),
  updateReview
);

// Delete Review
PropertyReviewRouter.delete(
  "/property/:propertyId/review/:reviewId",
  verifyToken,
  deleteReview
);

// Get all reviews for a property
PropertyReviewRouter.get(
  "/property/:propertyId/reviews",
  paginationMiddleware,
  getPropertyReviews
);

// Get all reviews by the logged-in user
PropertyReviewRouter.get(
  "/user/property/reviews",
  verifyToken,
  paginationMiddleware,
  getUserReviews
);

export default PropertyReviewRouter;
