import express from "express";
import {
  createContactUser,
  deleteContactById,
  getAllContacts,
} from "../../controllers/other/contactUser.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const ContactUserRouter = express.Router();

ContactUserRouter.post("/user/contact-user", createContactUser); // Create contact message
ContactUserRouter.get(
  "/admin/contact-user",
  verifyToken,
  verifyAdminOld,
  paginationMiddleware,
  getAllContacts
); // Admin: Get all contacts
ContactUserRouter.delete(
  "/admin/contact-user/:id",
  verifyToken,
  verifyAdminOld,
  deleteContactById
); // Admin: Delete contact

export default ContactUserRouter;
