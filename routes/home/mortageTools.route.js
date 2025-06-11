import express from "express";
import { upload } from "../../config/upload.js";
import {
  createData,
  deleteData,
  getData,
  getFrontendData,
  updateData,
} from "../../controllers/home/mortageTools.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const MortageToolsRouter = express.Router();

MortageToolsRouter.get("/get-mortage-tools", getFrontendData);
MortageToolsRouter.get("/mortage-tools", paginationMiddleware, getData);
MortageToolsRouter.post(
  "/mortage-tools",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  createData
);
MortageToolsRouter.put(
  "/mortage-tools",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateData
);
MortageToolsRouter.delete(
  "/mortage-tools/:id",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteData
);

export default MortageToolsRouter;
