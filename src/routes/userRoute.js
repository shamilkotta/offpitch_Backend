import express from "express";

import {
  getClubController,
  imageSignatureController,
  putClubController,
  putOrganizationController,
  postPlayerController,
  getOrganizationController,
} from "../controllers/userController.js";
import processImage from "../middlewares/processImage.js";
import organizationValidation from "../middlewares/validations/user/organization.js";
import playerValidation from "../middlewares/validations/user/player.js";

const router = express.Router();

// create or update organization
router.put(
  "/organization",
  processImage,
  organizationValidation,
  putOrganizationController
);

// get organization data
router.get("/organization", getOrganizationController);

// get signature for image upload to cloudinary
router.get("/image-signature", imageSignatureController);

// create or update club
router.put("/club", processImage, organizationValidation, putClubController);

// get club data
router.get("/club", getClubController);

// create player in club
router.post("/player", processImage, playerValidation, postPlayerController);

export default router;
