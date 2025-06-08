import express from "express";
import { upload } from "../../config/upload.js";
import {
  getPrivacyPolicy,
  getTermsOfUse,
  updatePrivacyPolicy,
  updateTermsOfUse,
} from "../../controllers/other/other.controller.js";
import { verifyAdmin, verifyToken } from "../../middleware/verifyToken.js";

const OtherRouter = express.Router();

import {
  getBuyingGuides,
  getMarketInsights,
  getSellingTips,
  updateBuyingGuides,
  updateMarketInsights,
  updateSellingTips,
} from "../../controllers/other/other.controller.js";

OtherRouter.get("/privacy-policy", getPrivacyPolicy);
OtherRouter.put(
  "/privacy-policy",
  verifyToken,
  verifyAdmin,
  upload.none(),
  updatePrivacyPolicy
);

OtherRouter.get("/terms-of-use", getTermsOfUse);
OtherRouter.put(
  "/terms-of-use",
  verifyToken,
  verifyAdmin,
  upload.none(),
  updateTermsOfUse
);

OtherRouter.get("/buying-guides", getBuyingGuides);
OtherRouter.put(
  "/buying-guides",
  verifyToken,
  verifyAdmin,
  upload.none(),
  updateBuyingGuides
);

OtherRouter.get("/selling-tips", getSellingTips);
OtherRouter.put(
  "/selling-tips",
  verifyToken,
  verifyAdmin,
  upload.none(),
  updateSellingTips
);

OtherRouter.get("/market-insights", getMarketInsights);
OtherRouter.put(
  "/market-insights",
  verifyToken,
  verifyAdmin,
  upload.none(),
  updateMarketInsights
);

export default OtherRouter;
