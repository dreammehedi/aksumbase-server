import express from "express";
import { upload } from "../../config/upload.js";
import {
  activateRole,
  getAllUserRoleApplications,
  purchaseRole,
  renewRole,
} from "../../controllers/auth/userRole.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const UserRoleRouter = express.Router();

UserRoleRouter.post(
  "/purchase",
  verifyToken,
  upload.single("image"),
  purchaseRole
);
UserRoleRouter.post(
  "/admin/activate",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  activateRole
);
// UserRoleRouter.post("/pause", verifyToken, pauseRole);
UserRoleRouter.post("/renew", verifyToken, upload.none(), renewRole);
UserRoleRouter.get(
  "/get-role-applications",
  verifyToken,
  getAllUserRoleApplications
);

export default UserRoleRouter;
