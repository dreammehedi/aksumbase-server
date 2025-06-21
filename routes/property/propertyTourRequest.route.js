import express from "express";
import { upload } from "../../config/upload.js";
import { requestTour } from "../../controllers/property/propertyTourRequest.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyTourRequestRouter = express.Router();

PropertyTourRequestRouter.post(
  "/property/tour-request",
  verifyToken,
  upload.none(),
  requestTour
);

export default PropertyTourRequestRouter;
