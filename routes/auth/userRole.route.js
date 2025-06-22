import express from "express";
import { upload } from "../../config/upload.js";
import {
  activateRole,
  createRolePurchaseIntent,
  getAllUserRoleApplications,
  handleRenewRolePackageFrontendSuccess,
  handleRolePackageFrontendSuccess,
} from "../../controllers/auth/userRole.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const UserRoleRouter = express.Router();

UserRoleRouter.post(
  "/purchase-intent",
  verifyToken,
  upload.none(),
  createRolePurchaseIntent
);

UserRoleRouter.post(
  "/admin/role-activate",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  activateRole
);
UserRoleRouter.get(
  "/get-role-applications",
  verifyToken,
  getAllUserRoleApplications
);

UserRoleRouter.get(
  "/role-package-payment-success",
  verifyToken,
  handleRolePackageFrontendSuccess
);

UserRoleRouter.get(
  "/renew-role-package-payment-success",
  verifyToken,
  handleRenewRolePackageFrontendSuccess
);
export default UserRoleRouter;
