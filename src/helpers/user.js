import mongoose from "mongoose";

import Club from "../models/club.js";
import Tournament from "../models/tournament.js";

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

export const allTournamentsData = async ({
  page = 1,
  limit = 10,
  search = "",
  sort = "createdAt,-1",
  filter = "",
}) => {
  const currentPage = page - 1;
  const sortOptions = sort.split(",");

  const sortBy = {};
  if (sortOptions[1] && sortOptions[1] === "1") sortBy[sortOptions[0]] = 1;
  else sortBy[sortOptions[0]] = -1;

  const reslut = await Tournament.aggregate([
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
      $match: {
        status: "active",
      },
    },
    // filter
    {
      $match: {
        status: { $regex: filter, $options: "i" },
      },
    },
    // search
    {
      $match: {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { tournament_type: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
        ],
      },
    },
    // sort
    {
      $sort: sortBy,
    },
    // transforming results
    {
      $facet: {
        allTournaments: [
          {
            $skip: currentPage * limit,
          },
          {
            $limit: limit,
          },
        ],
        total: [{ $count: "total" }],
      },
    },
    {
      $unwind: {
        path: "$total",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        total: "$total.total",
        page: currentPage + 1,
        limit,
      },
    },
  ]);
  return reslut[0];
};

export const getTournamentData = async ({ id }) => {
  const tournament = await Tournament.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(id),
      },
    },
    {
      $addFields: {
        id: "$_id",
        start_date: {
          $dateToString: {
            format: "%d/%m/%Y",
            date: "$start_date",
          },
        },
      },
    },
    {
      $lookup: {
        from: "clubs",
        foreignField: "_id",
        localField: "host",
        pipeline: [
          {
            $project: {
              name: 1,
              profile: 1,
              email: 1,
              phone: 1,
            },
          },
        ],
        as: "host",
      },
    },
    {
      $unwind: "$host",
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);
  return tournament[0];
};
