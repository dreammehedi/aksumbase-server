import express from "express";

import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import {
  createNewsletter,
  deleteNewsletter,
  getAllNewsletters,
  getUserNewsletters,
  incrementNewsletterClick,
  incrementNewsletterOpen,
  unsubscribeUser,
  updateNewsletter,
} from "../../controllers/other/newsletter.controller.js";
import { upload } from "../../config/upload.js";

const NewsletterRouter = express.Router();

// User route to create newsletter (could be admin-only if you want)
NewsletterRouter.post(
  "/admin/newsletters",
  upload.none(),
  verifyToken, // Require login
  verifyAdminOld, // Admin only
  createNewsletter
);

// Admin route to get all newsletters with pagination & filtering
NewsletterRouter.get(
  "/newsletters",
  verifyToken,
  paginationMiddleware,
  getAllNewsletters
);

NewsletterRouter.get(
  "/newsletters/:userId",
  verifyToken,
  paginationMiddleware,
  getUserNewsletters
);

// Admin route to update newsletter
NewsletterRouter.put(
  "/admin/newsletters/:id",
  verifyToken,
  upload.none(),
  verifyAdminOld,
  updateNewsletter
);

NewsletterRouter.put(
  "/user/newsletters-unsubscribe",
  verifyToken,
  upload.none(),
  unsubscribeUser
);

// Admin route to delete newsletter
NewsletterRouter.delete(
  "/admin/newsletters/:id",
  verifyToken,
  verifyAdminOld,
  deleteNewsletter
);

NewsletterRouter.post(
  "/newsletters/increment-open",
  verifyToken,
  incrementNewsletterOpen
);
NewsletterRouter.post(
  "/newsletters/increment-click",
  verifyToken,
  incrementNewsletterClick
);

export default NewsletterRouter;
