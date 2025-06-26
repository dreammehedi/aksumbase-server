import express from "express";
import { upload } from "../../config/upload.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const OtherRouter = express.Router();

import {
  getBuyingGuides,
  getContactInformation,
  getMarketAnalysis,
  getMarketInsights,
  getPress,
  getPrivacyPolicy,
  getSellingTips,
  getSocialNetwork,
  getTermsOfUse,
  updateBuyingGuides,
  updateContactInformation,
  updateMarketAnalysis,
  updateMarketInsights,
  updatePress,
  updatePrivacyPolicy,
  updateSellingTips,
  updateSocialNetwork,
  updateTermsOfUse,
} from "../../controllers/other/other.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";

OtherRouter.get("/privacy-policy", getPrivacyPolicy);
OtherRouter.put(
  "/privacy-policy",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updatePrivacyPolicy
);

OtherRouter.get("/terms-of-use", getTermsOfUse);
OtherRouter.put(
  "/terms-of-use",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateTermsOfUse
);

OtherRouter.get("/buying-guides", getBuyingGuides);
OtherRouter.put(
  "/buying-guides",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateBuyingGuides
);

OtherRouter.get("/selling-tips", getSellingTips);
OtherRouter.put(
  "/selling-tips",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateSellingTips
);

OtherRouter.get("/market-insights", getMarketInsights);
OtherRouter.put(
  "/market-insights",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateMarketInsights
);

OtherRouter.get("/market-analysis", getMarketAnalysis);
OtherRouter.put(
  "/market-analysis",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateMarketAnalysis
);

OtherRouter.get("/press", getPress);
OtherRouter.put(
  "/press",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updatePress
);

OtherRouter.get("/contact-information", getContactInformation);
OtherRouter.put(
  "/contact-information",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateContactInformation
);

OtherRouter.get("/social-network", getSocialNetwork);
OtherRouter.put(
  "/social-network",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateSocialNetwork
);

export default OtherRouter;
