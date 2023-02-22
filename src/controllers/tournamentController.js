import mongoose from "mongoose";

import ErrorResponse from "../error/ErrorResponse.js";
import Tournament from "../models/tournament.js";
import User from "../models/user.js";

// create and update tournament
export const putTournamentController = async (req, res, next) => {
  const id = req.body?.id || new mongoose.Types.ObjectId();
  const data = req.validData;
  const { id: userId } = req.userData;

  // find club
  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user?.club)
      return next(ErrorResponse.unauthorized("You don't have a club"));
  } catch (err) {
    return next(err);
  }

  // upsert the data into db
  try {
    const response = await Tournament.findOneAndUpdate(
      {
        _id: id,
        host: user.club,
        status: { $nin: ["active", "ended"] },
      },
      { $set: { ...data, host: user.club } },
      { upsert: true, new: true, rawResult: true }
    );

    // return response
    return res.status(200).json({
      success: true,
      message: "Tournament data saved successfully",
      data: {
        id: response.value._id,
        cover: response.value.cover,
      },
    });
  } catch (err) {
    if (err.codeName === "DuplicateKey")
      return next(ErrorResponse.badRequest("You can't edit this tournament"));
    return next(err);
  }
};

// get all tournament of user
export const getTournamentsController = async (req, res, next) => {
  const { id } = req.userData;

  // find club
  let result;
  try {
    result = await User.findOne({ _id: id });
    if (!result?.club)
      return next(ErrorResponse.forbidden("Can't find the club"));
  } catch (err) {
    return next(err);
  }

  // get tournament data
  try {
    const data = await Tournament.aggregate([
      {
        $match: {
          host: result.club,
        },
      },
      {
        $addFields: {
          start_date: {
            $dateToString: {
              format: "%d/%m/%Y",
              date: "$start_date",
            },
          },
        },
      },
      {
        $project: {
          cover: 1,
          title: 1,
          short_description: 1,
          location: 1,
          start_date: 1,
          status: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

// get single tournament data of user
export const getTournamentController = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.userData;
  if (!id) return next(ErrorResponse.notFound());

  // find club
  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user?.club)
      return next(ErrorResponse.forbidden("You don't have a club"));
  } catch (err) {
    return next(err);
  }

  // find tournament data
  try {
    const tournament = await Tournament.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
          host: user.club,
        },
      },
      {
        $addFields: {
          id: "$_id",
          start_date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$start_date",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    if (!tournament[0])
      return res.status(200).json({
        success: false,
        message: "Can't find the tournament",
      });

    return res.status(200).json({
      success: true,
      message: "Found one tournament",
      data: tournament[0],
    });
  } catch (err) {
    return next(err);
  }
};
