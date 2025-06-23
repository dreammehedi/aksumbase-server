import express from "express";
import { upload } from "../../config/upload.js";

import { verifyToken } from "../../middleware/verifyToken.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import {
  getSellPageBanner,
  updateSellPageBanner,
} from "../../controllers/other/sellBanner.controller.js";

const SellBannerRouter = express.Router();

// Public GET
SellBannerRouter.get("/sell-banner", getSellPageBanner);

// Admin PUT
SellBannerRouter.put(
  "/sell-banner",
  verifyToken,
  verifyAdminOld,
  upload.single("image"),
  updateSellPageBanner
);

export default SellBannerRouter;
