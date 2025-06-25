import express from "express";
import {
  createGetEstimate,
  deleteGetEstimateById,
  getAllGetEstimates,
} from "../../controllers/other/getEstimate.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const GetEstimateRouter = express.Router();

GetEstimateRouter.post("/user/get-estimate", createGetEstimate); // Create contact message
GetEstimateRouter.get(
  "/admin/get-estimate",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllGetEstimates
); // Admin: Get all contacts
GetEstimateRouter.delete(
  "/admin/get-estimate/:id",
  verifyToken,
  verifyAdminOld,
  deleteGetEstimateById
); // Admin: Delete contact

export default GetEstimateRouter;
