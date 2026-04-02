
// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const userService = require("../services/user.service");
const getMe = require("../controllers/auth.controller").getMe;
const authController = require("../controllers/auth.controller");

// Get current user info
router.get("/me", auth, getMe);

// Update user profile
router.patch("/profile", auth, authController.updateProfile);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

// Email and Password Reset
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// 2FA OTP
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;