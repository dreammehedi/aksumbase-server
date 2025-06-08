import express from "express";
import { upload } from "../../config/upload.js";
import {
  getPrivacyPolicy,
  getTermsOfUse,
  updatePrivacyPolicy,
  updateTermsOfUse,
} from "../../controllers/other/other.controller.js";

const OtherRouter = express.Router();

OtherRouter.get("/privacy-policy", getPrivacyPolicy);
OtherRouter.put("/privacy-policy", upload.none(), updatePrivacyPolicy);

OtherRouter.get("/terms-of-use", getTermsOfUse);
OtherRouter.put("/terms-of-use", upload.none(), updateTermsOfUse);

export default OtherRouter;
