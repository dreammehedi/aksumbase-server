import express from "express";
import { upload } from "../../config/upload.js";
import {
  getDevelopmentPlatform,
  updateDevelopmentPlatform,
} from "../../controllers/home/developmentPlatform.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const DevelopmentPlatformRouter = express.Router();

DevelopmentPlatformRouter.get("/development-platform", getDevelopmentPlatform);
DevelopmentPlatformRouter.put(
  "/development-platform",
  verifyToken,
  verifyAdminOld,
  upload.single("image"),
  updateDevelopmentPlatform
);

export default DevelopmentPlatformRouter;
