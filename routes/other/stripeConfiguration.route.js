import express from "express";
import { upload } from "../../config/upload.js";
import {
  getStripeConfiguration,
  updateStripeConfiguration,
} from "../../controllers/other/stripeConfiguration.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const StripeConfigurationRouter = express.Router();

StripeConfigurationRouter.get("/stripe-configuration", getStripeConfiguration);
StripeConfigurationRouter.put(
  "/stripe-configuration",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateStripeConfiguration
);

export default StripeConfigurationRouter;
