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
import { verifyAdmin, verifyToken } from "../../middleware/verifyToken.js";

const MortageToolsRouter = express.Router();

MortageToolsRouter.get("/get-mortage-tools", getFrontendData);
MortageToolsRouter.get("/mortage-tools", paginationMiddleware, getData);
MortageToolsRouter.post(
  "/mortage-tools",
  verifyToken,
  verifyAdmin,
  upload.none(),
  createData
);
MortageToolsRouter.put("/mortage-tools", upload.none(), updateData);
MortageToolsRouter.delete(
  "/mortage-tools/:id",
  verifyToken,
  verifyAdmin,
  upload.none(),
  deleteData
);

export default MortageToolsRouter;
