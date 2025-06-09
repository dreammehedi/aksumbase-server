import express from "express";
import { loginWithGoogle } from "../controllers/auth.controller.js";
const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
// router.post("/logout", logout);
router.post("/login/google", loginWithGoogle);

export default router;
