import express from "express";
import { upload } from "../../config/upload.js";
import {
  createProperty,
  deleteProperty,
  getProperty,
  getPropertyBySlug,
  property,
  updateProperty,
} from "../../controllers/property/property.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const PropertyRouter = express.Router();

PropertyRouter.get("/get-property", getProperty);
PropertyRouter.get("/property", paginationMiddleware, property);
PropertyRouter.post(
  "/property",
  verifyToken,
  verifyAdminOld,
  upload.array("images", 10),
  createProperty
);
PropertyRouter.put(
  "/property",
  verifyToken,
  verifyAdminOld,
  upload.array("images", 10),
  updateProperty
);
PropertyRouter.delete(
  "/property/:id",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteProperty
);

PropertyRouter.get("/property-details/:slug", getPropertyBySlug);
export default PropertyRouter;
