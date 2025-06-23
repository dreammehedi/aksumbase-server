import express from "express";
import { upload } from "../../config/upload.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";

import {
  getSellTypes,
  updateSellType,
} from "../../controllers/other/sellTypes.controller.js";

const SellTypesRouter = express.Router();

// Public - get all types
SellTypesRouter.get("/sell-types", getSellTypes);

// Admin - update a specific type
SellTypesRouter.put(
  "/sell-types/:id",
  verifyToken,
  verifyAdminOld,
  upload.single("image"),
  updateSellType
);

export default SellTypesRouter;
