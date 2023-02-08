import express from "express";

import {
  imageSignatureController,
  postClubController,
  postOrganizationController,
} from "../controllers/userController.js";
import processImage from "../middlewares/processImage.js";
import organizationValidation from "../middlewares/validations/user/organization.js";

const router = express.Router();

// create or update organization
router.post(
  "/organization",
  processImage,
  organizationValidation,
  postOrganizationController
);

// get signature for image upload to cloudinary
router.get("/image-signature", imageSignatureController);

// create or update club
router.post("/club", processImage, organizationValidation, postClubController);

export default router;
