import express from "express";

import {
  emailVerificationController,
  signupController,
} from "../controllers/index.js";
import signupValidation from "../middlewares/validations/signupValidation.js";
import verifyEmailValidation from "../middlewares/validations/verifyEmailValidation.js";

const router = express.Router();

router.post("/signup", signupValidation, signupController);
router.post(
  "/verify-email",
  verifyEmailValidation,
  emailVerificationController
);

export default router;
