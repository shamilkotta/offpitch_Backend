import express from "express";

import { imageSignatureController } from "../controllers/guestController.js";
import {
  getTournamentController,
  getTournamentsController,
  putTournamentController,
} from "../controllers/tournamentController.js";
import {
  getClubController,
  putClubController,
  postPlayerController,
} from "../controllers/userController.js";
import processImage from "../middlewares/processImage.js";
import clubValidation from "../middlewares/validations/user/club.js";
import playerValidation from "../middlewares/validations/user/player.js";
import tournamentValidation from "../middlewares/validations/user/tournament.js";

const router = express.Router();

// get signature for image upload to cloudinary
router.get("/image-signature", imageSignatureController);

// create or update club
router.put("/club", processImage, clubValidation, putClubController);

// get club data
router.get("/club", getClubController);

// create player in club
router.post("/player", processImage, playerValidation, postPlayerController);

// create tournament
router.put(
  "/tournament",
  processImage,
  tournamentValidation,
  putTournamentController
);

// get all tournaments
router.get("/tournaments", getTournamentsController);

// get a tournament
router.get("/tournament/:id", getTournamentController);

export default router;
