import express from "express";
import { upload } from "../../config/upload.js";
import {
  createFaqs,
  deleteFaqs,
  faqs,
  getFaqs,
  updateFaqs,
} from "../../controllers/other/faqs.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const FaqsRouter = express.Router();

FaqsRouter.get("/get-faqs", getFaqs);
FaqsRouter.get("/faqs", paginationMiddleware, faqs);
FaqsRouter.post(
  "/faqs",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  createFaqs
);
FaqsRouter.put("/faqs", verifyToken, verifyAdminOld, upload.none(), updateFaqs);
FaqsRouter.delete(
  "/faqs/delete",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteFaqs
);

export default FaqsRouter;
