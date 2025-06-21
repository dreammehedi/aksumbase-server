import express from "express";
import { upload } from "../../config/upload.js";
import { requestPropertyContactUser } from "../../controllers/property/propertyContactUserRequest.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyContactUserRequestRouter = express.Router();

PropertyContactUserRequestRouter.post(
  "/property/contact-user",
  verifyToken,
  upload.none(),
  requestPropertyContactUser
);

export default PropertyContactUserRequestRouter;
