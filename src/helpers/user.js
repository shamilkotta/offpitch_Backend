import Club from "../models/club.js";

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

// for avoiding lint error
export const test = "";
