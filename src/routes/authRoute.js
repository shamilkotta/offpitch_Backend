import express from "express";

import {
  emailVerificationController,
  loginController,
  logoutController,
  refreshController,
  resendController,
  signupController,
} from "../controllers/authController.js";
import loginValidation from "../middlewares/validations/loginValidation.js";
import signupValidation from "../middlewares/validations/signupValidation.js";
import verifyEmailValidation from "../middlewares/validations/verifyEmailValidation.js";

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

export default router;
