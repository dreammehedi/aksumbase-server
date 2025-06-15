import express from "express";
import { upload } from "../../config/upload.js";
import {
  requestPropertyContactUser,
  userRequestPropertyContactUser,
} from "../../controllers/property/propertyContactUserRequest.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyContactUserRequestRouter = express.Router();

PropertyContactUserRequestRouter.post(
  "/property/contact-user",
  verifyToken,
  upload.none(),
  requestPropertyContactUser
);
PropertyContactUserRequestRouter.get(
  "/user/property/contact-user",
  verifyToken,
  paginationMiddleware,
  userRequestPropertyContactUser
);

export default PropertyContactUserRequestRouter;
