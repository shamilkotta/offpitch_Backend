import express from "express";

import {
  getClubsController,
  patchClubController,
} from "../controllers/clubController.js";
import {
  getUsersController,
  patchUserController,
} from "../controllers/userController.js";

const router = express.Router();

// all clubs
router.get("/clubs", getClubsController);

// change status of club
router.patch("/club/update-status", patchClubController);

// all users
router.get("/users", getUsersController);

// change status of user
router.patch("/user/update-status", patchUserController);

export default router;
