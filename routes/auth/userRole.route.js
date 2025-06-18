import express from "express";
import {
  activateRole,
  getAllUserRoleApplications,
  purchaseRole,
  renewRole,
} from "../../controllers/auth/userRole.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { upload } from "../../config/upload.js";
const UserRoleRouter = express.Router();

UserRoleRouter.post("/purchase", verifyToken, upload.none(), purchaseRole);
UserRoleRouter.post("/activate", verifyToken, activateRole);
// UserRoleRouter.post("/pause", verifyToken, pauseRole);
UserRoleRouter.post("/renew", verifyToken, renewRole);
UserRoleRouter.get(
  "/get-role-applications",
  verifyToken,
  getAllUserRoleApplications
);

export default UserRoleRouter;
