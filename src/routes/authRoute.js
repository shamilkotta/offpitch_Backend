import express from "express";

import {
  adminLoginController,
  emailVerificationController,
  forgotPasswordController,
  loginController,
  logoutController,
  refreshController,
  resendController,
  resetPasswordController,
  signupController,
} from "../controllers/authController.js";
import loginValidation from "../middlewares/validations/auth/loginValidation.js";
import resetPasswordValidation from "../middlewares/validations/auth/resetPasswordValidation.js";
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

router.post(
  "/reset-password",
  resetPasswordValidation,
  resetPasswordController
);

router.post("/admin/login", loginValidation, adminLoginController);

export default router;
