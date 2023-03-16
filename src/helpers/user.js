import mongoose from "mongoose";
import Club from "../models/club.js";
import Tournament from "../models/tournament.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";

export const getClubData = async (filter) => {
  const result = await Club.aggregate([
    {
      $match: filter,
    },
    {
      $addFields: {
        followers: { $size: "$followers" },
        players: {
          $map: {
            input: "$players",
            as: "player",
            in: {
              name: "$$player.name",
              profile: "$$player.profile",
              _id: "$$player._id",
              age: {
                $floor: {
                  $divide: [
                    { $subtract: [new Date(), "$$player.date_of_birth"] },
                    365.25 * 24 * 60 * 60 * 1000,
                  ],
                },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        followers: {
          $cond: {
            if: { $gte: ["$followers", 1000] },
            then: {
              $cond: {
                if: { $gte: ["$followers", 1000000] },
                then: { $concat: ["$followers", "M"] },
                else: { $concat: ["$followers", "K"] },
              },
            },
            else: "$followers",
          },
        },
      },
    },
  ]);

  return result[0];
};

export const getUserPlayers = async ({ id }) => {
  const players = await Club.findOne(
    { author: id, status: "active" },
    { players: 1 }
  );
  if (!players?._id) return { success: false, message: "Don't have a club" };
  return { success: true, data: players?.players };
};

export const checkRegistered = async ({ userId, id }) => {
  const club = await Club.findOne({ author: userId }, { _id: 1 });
  if (!club) return false;
  const result = await Tournament.findOne({
    _id: id,
    teams: {
      $elemMatch: {
        club: club._id,
      },
    },
  });
  return Boolean(result);
};

export const getTransactions = async ({ from, limit }) => {
  const result = await Transaction.aggregate([
    {
      $match: {
        $or: [{ from }, { to: from }],
        status: true,
      },
    },
    {
      $lookup: {
        from: "clubs",
        localField: "from",
        foreignField: "_id",
        as: "fromClub",
      },
    },
    {
      $lookup: {
        from: "clubs",
        localField: "to",
        foreignField: "_id",
        as: "toClub",
      },
    },
    {
      $project: {
        _id: 1,
        amount: 1,
        from: { $arrayElemAt: ["$fromClub.name", 0] },
        to: { $arrayElemAt: ["$toClub.name", 0] },
        createdAt: 1,
      },
    },
    {
      $addFields: {
        transaction_date: {
          $concat: [
            { $substr: [{ $dayOfMonth: "$createdAt" }, 0, 2] },
            " ",
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 1] },
                    then: "Jan",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 2] },
                    then: "Feb",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 3] },
                    then: "Mar",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 4] },
                    then: "Apr",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 6] },
                    then: "Jun",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 7] },
                    then: "Jul",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 8] },
                    then: "Aug",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 9] },
                    then: "Sep",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 10] },
                    then: "Oct",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 11] },
                    then: "Nov",
                  },
                  {
                    case: { $eq: [{ $month: "$createdAt" }, 12] },
                    then: "Dec",
                  },
                ],
                default: "",
              },
            },
            " ",
            { $substr: [{ $year: "$createdAt" }, 0, 4] },
          ],
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: parseInt(limit, 10),
    },
  ]);

  return result;
};

export const getWatchlist = async ({ userId, limit }) => {
  const result = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        watchlist: 1,
      },
    },
    {
      $unwind: {
        path: "$watchlist",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "tournaments",
        localField: "watchlist",
        foreignField: "_id",
        as: "tournament",
      },
    },
    {
      $unwind: "$tournament",
    },
    {
      $match: {
        "tournament.status": { $ne: "ended" },
      },
    },
    {
      $project: {
        _id: "$watchlist",
        title: "$tournament.title",
        cover: "$tournament.cover",
        start_date: "$tournament.start_date",
        status: "$tournament.status",
      },
    },
    {
      $addFields: {
        start_date: {
          $concat: [
            { $substr: [{ $dayOfMonth: "$start_date" }, 0, 2] },
            " ",
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$start_date" }, 1] },
                    then: "Jan",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 2] },
                    then: "Feb",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 3] },
                    then: "Mar",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 4] },
                    then: "Apr",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 6] },
                    then: "Jun",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 7] },
                    then: "Jul",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 8] },
                    then: "Aug",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 9] },
                    then: "Sep",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 10] },
                    then: "Oct",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 11] },
                    then: "Nov",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 12] },
                    then: "Dec",
                  },
                ],
                default: "",
              },
            },
            " ",
            { $substr: [{ $year: "$start_date" }, 0, 4] },
          ],
        },
      },
    },
    {
      $limit: parseInt(limit, 10),
    },
  ]);

  return result;
};

export const getProfile = async ({ userId }) => {
  const data = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        authToken: 0,
        createdAt: 0,
        updatedAt: 0,
        role: 0,
        email_verification: 0,
        watchlist: 0,
        password: 0,
      },
    },
    {
      $lookup: {
        from: "clubs",
        localField: "_id",
        foreignField: "author",
        pipeline: [
          {
            $project: {
              name: 1,
              profile: 1,
              followers: 1,
              players: 1,
              status: 1,
            },
          },
          {
            $addFields: {
              followers: {
                $size: "$followers",
              },
              players: {
                $size: "$players",
              },
            },
          },
        ],
        as: "club",
      },
    },
    {
      $unwind: {
        path: "$club",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
  return data[0];
};
