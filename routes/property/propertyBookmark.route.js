import express from "express";
import { upload } from "../../config/upload.js";
import {
  addBookmark,
  getUserBookmarks,
  removeBookmark,
  toggleBookmark,
} from "../../controllers/property/propertyBookmark.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyBookmarkRouter = express.Router();

PropertyBookmarkRouter.post(
  "/property/bookmark",
  verifyToken,
  upload.none(),
  addBookmark
);
PropertyBookmarkRouter.put(
  "/property/bookmark",
  verifyToken,
  upload.none(),
  removeBookmark
);
PropertyBookmarkRouter.get(
  "/property/bookmark/:userId",
  verifyToken,
  getUserBookmarks
);
PropertyBookmarkRouter.post(
  "/property/bookmark-toggle",
  verifyToken,
  upload.none(),
  toggleBookmark
);

export default PropertyBookmarkRouter;
