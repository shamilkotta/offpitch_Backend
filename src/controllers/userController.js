import ErrorResponse from "../error/ErrorResponse.js";
import { allUsersData } from "../helpers/admin.js";
import { getWatchlist } from "../helpers/user.js";
import User from "../models/user.js";

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
