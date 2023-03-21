import express from "express";

import { getRegisteredClubController } from "../controllers/guestController.js";
import {
  getTournamentController,
  getTournamentsController,
} from "../controllers/tournamentController.js";

const router = express.Router();

// get all tournaments for guest users
router.get("/tournaments", getTournamentsController);

// get tournament data
router.get("/tournament/:id", getTournamentController);

// get registered club data
router.get("/tournament/:tournament/club/:club", getRegisteredClubController);

export default router;
