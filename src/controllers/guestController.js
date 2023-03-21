import mongoose from "mongoose";

import Tournament from "../models/tournament.js";

/* eslint-disable import/prefer-default-export */
export const getRegisteredClubController = async (req, res, next) => {
  const { tournament: tournamentId, club: clubId } = req.params;

  // fetch club data
  try {
    const result = await Tournament.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(tournamentId),
        },
      },
      {
        $unwind: {
          path: "$teams",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "teams.club": mongoose.Types.ObjectId(clubId),
        },
      },
      {
        $lookup: {
          from: "clubs",
          foreignField: "_id",
          localField: "teams.club",
          as: "club",
        },
      },
      {
        $unwind: "$club",
      },
      {
        $project: {
          _id: "$club._id",
          name: "$club.name",
          profile: "$club.profile",
          description: "$club.description",
          players: {
            $filter: {
              input: "$club.players",
              as: "players",
              cond: { $in: ["$$players._id", "$teams.players"] },
            },
          },
        },
      },
    ]);
    if (result[0].name)
      return res.status(200).json({
        success: true,
        data: result[0],
      });

    return res.status(200).json({
      success: false,
      message: "Can't find club",
    });
  } catch (err) {
    return next(err);
  }
};
