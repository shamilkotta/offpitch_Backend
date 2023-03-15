import express from "express";

import {
  getTournamentInvoice,
  getUserTournamentController,
  getUserTournamentsController,
  postRegistrationFee,
  putTournamentController,
  tournamentRegisterController,
} from "../controllers/tournamentController.js";
import {
  getClubController,
  putClubController,
  postPlayerController,
  getPlayersController,
} from "../controllers/clubController.js";
import clubValidation from "../middlewares/validations/user/club.js";
import playerValidation from "../middlewares/validations/user/player.js";
import tournamentValidation from "../middlewares/validations/user/tournament.js";
import { parseCover, parseDoc } from "../middlewares/multer.js";
import { scheduelMatchesController } from "../controllers/matchController.js";

const router = express.Router();

// create or update club
router.put("/club", parseDoc, clubValidation, putClubController);

// get club data
router.get("/club", getClubController);

// create player in club
router.post("/player", parseDoc, playerValidation, postPlayerController);

// get user club players
router.get("/players", getPlayersController);

// create tournament
router.put(
  "/tournament",
  parseCover,
  tournamentValidation,
  putTournamentController
);

// get all tournaments
router.get("/tournaments", getUserTournamentsController);

// get a tournament
router.get("/tournament/:id", getUserTournamentController);

// register for tournament
router.post(
  "/tournament/:id/register",
  tournamentRegisterController,
  getTournamentInvoice
);

// process registration payment
router.post("/tournament/:id/fee", postRegistrationFee);

// generate fixture or schedule matches
router.get("/tournament/:id/schedule", scheduelMatchesController);

export default router;
