import express from "express";
import { upload } from "../../config/upload.js";
import {
  createMortgageRate,
  deleteMortgageRate,
  getMortgageRate,
  mortgageRate,
  updateMortgageRate,
} from "../../controllers/loan-officer/mortgageRate.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyLoanOfficer } from "../../middleware/verifyLoanOfficer.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const MortgageRateRouter = express.Router();

MortgageRateRouter.get("/get-mortgage-rate", getMortgageRate);
MortgageRateRouter.get("/mortgage-rate", paginationMiddleware, mortgageRate);
MortgageRateRouter.post(
  "/mortgage-rate",
  verifyToken,
  verifyLoanOfficer,
  upload.none(),
  createMortgageRate
);
MortgageRateRouter.put(
  "/mortgage-rate",
  verifyToken,
  verifyLoanOfficer,
  upload.none(),
  updateMortgageRate
);
MortgageRateRouter.delete(
  "/mortgage-rate/delete",
  verifyToken,
  verifyLoanOfficer,
  upload.none(),
  deleteMortgageRate
);

export default MortgageRateRouter;
