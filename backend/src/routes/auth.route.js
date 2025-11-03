import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  deleteAccount,
  firebaseAuth,
  sendVerificationCode,
  verifyEmail,
  resendVerificationCode,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/firebase-auth", firebaseAuth);

// Email verification routes
router.post("/send-verification", sendVerificationCode);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);

router.put("/update-profile", protectRoute, updateProfile);
router.delete("/delete-account", protectRoute, deleteAccount);

router.get("/check", protectRoute, checkAuth);

export default router;
