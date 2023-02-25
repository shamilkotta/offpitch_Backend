import Club from "../models/club.js";
import User from "../models/user.js";

export const allClubsData = async ({
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

  const result = await Club.aggregate([
    {
      $project: {
        players: 0,
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
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
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
        allClubs: [
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
  return result[0];
};

export const allUsersData = async ({
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

  const result = await User.aggregate([
    {
      $match: {
        role: { $ne: "admin" },
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
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
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
        allUsers: [
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
  return result[0];
};
