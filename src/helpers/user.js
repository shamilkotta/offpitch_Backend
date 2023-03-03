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

export const getUserPlayers = async ({ id }) => {
  const players = await Club.findOne(
    { author: id, status: "active" },
    { players: 1 }
  );
  if (!players._id) return { success: false, message: "Don't have a club" };
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
