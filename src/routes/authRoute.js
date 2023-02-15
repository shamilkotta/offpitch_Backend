import express from "express";

import {
  emailVerificationController,
  forgotPasswordController,
  loginController,
  logoutController,
  refreshController,
  resendController,
  signupController,
} from "../controllers/authController.js";
import loginValidation from "../middlewares/validations/auth/loginValidation.js";
import signupValidation from "../middlewares/validations/auth/signupValidation.js";
import verifyEmailValidation from "../middlewares/validations/auth/verifyEmailValidation.js";

const router = express.Router();

router.post(
  "/verify-email",
  verifyEmailValidation,
  emailVerificationController
);
router.post("/signup", signupValidation, signupController);
router.get("/refresh", refreshController);
router.post("/login", loginValidation, loginController);
router.get("/resend-otp/:token", resendController);
router.get("/logout", logoutController);
router.post("/forgot-password", forgotPasswordController);

export default router;
