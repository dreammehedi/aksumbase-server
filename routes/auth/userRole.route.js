import express from "express";
import {
  activateRole,
  pauseRole,
  purchaseRole,
  renewRole,
} from "../../controllers/auth/userRole.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { upload } from "../../config/upload.js";
const UserRoleRouter = express.Router();

UserRoleRouter.post(
  "/purchase",
  verifyToken,
  upload.fields([
    { name: "nid", maxCount: 1 },
    { name: "passport", maxCount: 1 },
  ]),
  purchaseRole
);
UserRoleRouter.post("/activate", verifyToken, activateRole);
UserRoleRouter.post("/pause", verifyToken, pauseRole);
UserRoleRouter.post("/renew", verifyToken, renewRole);

export default UserRoleRouter;
