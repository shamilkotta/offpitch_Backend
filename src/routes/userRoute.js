import express from "express";

import {
  cancelRegistrationController,
  getRegisteredTournaments,
  getTournamentInvoice,
  getUserTournamentController,
  getUserTournamentsController,
  postRegistrationFee,
  putTournamentController,
  saveToWatchlistController,
  tournamentRegisterController,
  updateRegistrationController,
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
import {
  scheduelMatchesController,
  updateResultController,
} from "../controllers/matchController.js";
import {
  getUserProfile,
  getUserTransactions,
  getUserWatchlist,
} from "../controllers/userController.js";

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

// get registered tournaments
router.get("/tournaments/registered", getRegisteredTournaments);

// save to watchlist
router.get("/tournament/:id/save", saveToWatchlistController);

// get a tournament
router.get("/tournament/:id", getUserTournamentController);

// register for tournament
router.post(
  "/tournament/:id/register",
  tournamentRegisterController,
  getTournamentInvoice
);

// update pending registration
router.post(
  "/tournament/:id/register-update",
  updateRegistrationController,
  getTournamentInvoice
);

// cancel registration
router.delete("/tournament/:id/cancel", cancelRegistrationController);

// process registration payment
router.post("/tournament/:id/fee", postRegistrationFee);

// generate fixture or schedule matches
router.get("/tournament/:id/schedule", scheduelMatchesController);

// get watchlist
router.get("/watchlist", getUserWatchlist);

// get transactions
router.get("/transactions", getUserTransactions);

// get profile
router.get("/profile", getUserProfile);

// update match result
router.post("/tournament/:id/result", updateResultController);

export default router;
