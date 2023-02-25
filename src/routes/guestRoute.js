import express from "express";

import {
  getTournamentController,
  getTournamentsController,
} from "../controllers/tournamentController.js";

const router = express.Router();

// get all tournaments for guest users
router.get("/tournaments", getTournamentsController);

// get tournament data
router.get("/tournament/:id", getTournamentController);

export default router;
