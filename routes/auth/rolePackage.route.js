import express from "express";
import { upload } from "../../config/upload.js";
import {
  createRolePackage,
  getAllRolePackages,
  updateRolePackage,
} from "../../controllers/auth/rolePackage.controller.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const RolePackageRouter = express.Router();

RolePackageRouter.get("/role-package", getAllRolePackages);
RolePackageRouter.post(
  "/role-package",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  createRolePackage
);

RolePackageRouter.put(
  "/role-package",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateRolePackage
);

export default RolePackageRouter;
