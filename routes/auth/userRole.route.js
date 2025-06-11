import express from "express";
import {
  activateRole,
  pauseRole,
  purchaseRole,
  renewRole,
} from "../../controllers/auth/userRole.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const UserRoleRouter = express.Router();

UserRoleRouter.post("/purchase", verifyToken, purchaseRole);
UserRoleRouter.post("/activate", verifyToken, activateRole);
UserRoleRouter.post("/pause", verifyToken, pauseRole);
UserRoleRouter.post("/renew", verifyToken, renewRole);

export default UserRoleRouter;
