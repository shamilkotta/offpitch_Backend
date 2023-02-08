import express from "express";
import { postOrganizationController } from "../controllers/userController.js";

import organizationValidation from "../middlewares/validations/user/organization.js";

const router = express.Router();

router.post(
  "/organization",
  organizationValidation,
  postOrganizationController
);

export default router;
