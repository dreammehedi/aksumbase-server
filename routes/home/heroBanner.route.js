import express from "express";
import { upload } from "../../config/upload.js";
import {
  getHeroBanner,
  updateHeroBanner,
} from "../../controllers/home/heroBanner.controller.js";

const HeroBannerRouter = express.Router();

HeroBannerRouter.get("/hero-banner", getHeroBanner);
HeroBannerRouter.put("/hero-banner", upload.single("image"), updateHeroBanner);

export default HeroBannerRouter;
