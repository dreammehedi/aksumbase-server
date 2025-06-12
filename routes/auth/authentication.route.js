import express from "express";
import passport from "../../config/passport.config.js";
import { upload } from "../../config/upload.js";
import {
  changePassword,
  forgotPassword,
  getUserProfile,
  googleLogin,
  loginUser,
  logout,
  registerUser,
  resetPassword,
  updateProfile,
} from "../../controllers/auth/authentication.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const AuthenticationRouter = express.Router();
const AuthRouter = express.Router();

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

// Initiate Google login
AuthRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle Google callback
AuthRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://aksumbase-frontend-qsfw.vercel.app/login",
  }),
  googleLogin
);

export { AuthenticationRouter, AuthRouter };
