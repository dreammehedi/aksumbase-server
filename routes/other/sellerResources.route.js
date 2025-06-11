import express from "express";
import { upload } from "../../config/upload.js";
import {
  createSellerResources,
  deleteSellerResources,
  getSellerResources,
  sellerResources,
  updateSellerResources,
} from "../../controllers/other/sellerResources.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const SellerResourcesRouter = express.Router();

SellerResourcesRouter.get("/get-seller-resources", getSellerResources);
SellerResourcesRouter.get(
  "/seller-resources",
  paginationMiddleware,
  sellerResources
);
SellerResourcesRouter.post(
  "/seller-resources",
  verifyToken,
  verifyAdminOld,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "itemImage", maxCount: 15 },
  ]),
  createSellerResources
);
SellerResourcesRouter.put(
  "/seller-resources",
  verifyToken,
  verifyAdminOld,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "itemImage", maxCount: 15 },
  ]),
  updateSellerResources
);
SellerResourcesRouter.delete(
  "/seller-resources/:id",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteSellerResources
);

export default SellerResourcesRouter;
