import express from "express";
import { upload } from "../../config/upload.js";
import {
  getHeroBanner,
  updateHeroBanner,
} from "../../controllers/home/heroBanner.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const HeroBannerRouter = express.Router();

HeroBannerRouter.get("/hero-banner", getHeroBanner);
HeroBannerRouter.put(
  "/hero-banner",
  verifyToken,
  verifyAdminOld,
  upload.single("image"),
  updateHeroBanner
);

export default HeroBannerRouter;
