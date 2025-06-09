import express from "express";
import { upload } from "../../config/upload.js";
import {
  changePassword,
  forgotPassword,
  getUserProfile,
  loginUser,
  logout,
  registerUser,
  resetPassword,
  updateProfile,
} from "../../controllers/auth/authentication.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const AuthenticationRouter = express.Router();

AuthenticationRouter.get("/user-profile/:email", getUserProfile);
AuthenticationRouter.post("/user-register", upload.none(), registerUser);
AuthenticationRouter.post("/login", upload.none(), loginUser);
AuthenticationRouter.post("/forgot-password", upload.none(), forgotPassword);
AuthenticationRouter.post("/reset-password", upload.none(), resetPassword);
AuthenticationRouter.post("/logout", upload.none(), verifyToken, logout);
AuthenticationRouter.put(
  "/update-profile",
  verifyToken,
  upload.single("avatar"),
  updateProfile
);
AuthenticationRouter.put(
  "/change-password",
  verifyToken,
  upload.none(),
  changePassword
);
export default AuthenticationRouter;
