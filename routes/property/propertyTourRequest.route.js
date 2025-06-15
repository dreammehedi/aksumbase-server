import express from "express";
import { upload } from "../../config/upload.js";
import {
  requestTour,
  userRequestTour,
} from "../../controllers/property/propertyTourRequest.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyTourRequestRouter = express.Router();

PropertyTourRequestRouter.post(
  "/property/tour-request",
  verifyToken,
  upload.none(),
  requestTour
);
PropertyTourRequestRouter.get(
  "/user/property/tour-request",
  verifyToken,
  paginationMiddleware,
  userRequestTour
);

export default PropertyTourRequestRouter;
