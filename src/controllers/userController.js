import mongoose from "mongoose";
import ErrorResponse from "../error/ErrorResponse.js";
import { allUsersData } from "../helpers/admin.js";
import { getProfile, getTransactions, getWatchlist } from "../helpers/user.js";
import User from "../models/user.js";
import Club from "../models/club.js";
import Tournament from "../models/tournament.js";

// get all users
export const getUsersController = async (req, res, next) => {
  let { page = 1, limit = 10, filter = "" } = req.query;
  const { search = "", sort = "createdAt,-1" } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (filter === "all") filter = "";
  // get all clubs data to display in table
  try {
    const data = await allUsersData({ page, limit, search, sort, filter });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

// update user status
export const patchUserController = async (req, res, next) => {
  const { status, id, comment = "" } = req.body;

  if (!status || !id)
    return next(ErrorResponse.badRequest("Invalid credentials"));

  // change club status
  try {
    const result = await User.updateOne(
      { _id: id },
      { $set: { status, comment } }
    );

    if (result.modifiedCount)
      return res.status(200).json({
        success: true,
        message: "User status udpated successfully",
      });

    return next(ErrorResponse.badRequest("Invalid credentials"));
  } catch (err) {
    return next(err);
  }
};

export const getUserWatchlist = async (req, res, next) => {
  const { id: userId } = req.userData;
  const { limit = 10 } = req.query;

  // fetch all watchlist
  try {
    const data = await getWatchlist({ userId, limit });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserTransactions = async (req, res, next) => {
  const { id: userId } = req.userData;
  const { limit = 10 } = req.query;

  // find club
  let club;
  try {
    club = await Club.findOne({ author: mongoose.Types.ObjectId(userId) });

    if (!club._id)
      return next(ErrorResponse.badRequest("Can't fetch club data"));
  } catch (err) {
    return next(err);
  }

  // fetch transactions
  try {
    const data = await getTransactions({ from: club._id, limit });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserProfile = async (req, res, next) => {
  const { id: userId } = req.userData;

  try {
    const data = await getProfile({ userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

export const getDashboardData = async (req, res, next) => {
  try {
    const userCount = await User.find({}).count();
    const clubCount = await Club.find({}).count();
    const allTournament = await Tournament.find({}).count();
    const activeTournament = await Tournament.find({
      "registration.status": "scheduled",
    }).count();
    const upcomingTournament = await Tournament.find({
      "registration.status": "open",
    }).count();

    const wallet = await User.aggregate([
      {
        $project: {
          wallet: 1,
        },
      },
      {
        $group: {
          _id: null,
          wallet: { $sum: "$wallet" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        userCount,
        clubCount,
        allTournament,
        activeTournament,
        upcomingTournament,
        wallet: wallet[0]?.wallet,
      },
    });
  } catch (err) {
    return next(err);
  }
};
