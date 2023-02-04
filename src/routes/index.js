import express from "express";

import signupController from "../controllers/index.js";
import signupValidation from "../middlewares/validations/signupValidation.js";

const router = express.Router();

router.post("/signup", signupValidation, signupController);

export default router;
