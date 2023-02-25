import mongoose from "mongoose";

import ErrorResponse from "../error/ErrorResponse.js";
import { allClubsData } from "../helpers/admin.js";
import { getClubData } from "../helpers/user.js";
import Club from "../models/club.js";
import User from "../models/user.js";

// Create or update a club page
export const putClubController = async (req, res, next) => {
  const { id } = req.userData;
  const clubData = req.validData;

  // save data to db
  let result;
  try {
    result = await Club.findOneAndUpdate(
      { author: id },
      { $set: { ...clubData } },
      { upsert: true, new: true, rawResult: true }
    );
  } catch (err) {
    return next(err);
  }

  if (!result.value._id)
    return next(ErrorResponse.badRequest("Something went wrong"));

  // if updated then change status and send response
  if (result.lastErrorObject?.updatedExisting) {
    if (result.value.status === "rejected")
      try {
        await Club.findOneAndUpdate(
          { author: id },
          { $set: { status: "awaiting" } }
        );

        return res.status(200).json({
          success: true,
          message: "Club data updated successfully",
          data: result,
        });
      } catch (err) {
        return next(err);
      }
  }

  // if upserted then save id to user profile
  try {
    const response = await User.updateOne(
      { _id: id },
      { $set: { club: result.value._id } }
    );
    if (response.modifiedCount)
      return res
        .status(200)
        .json({ success: true, message: "New club created successfully" });

    return next(ErrorResponse.badRequest("Something went wrong"));
  } catch (err) {
    return next(err);
  }
};

// get club data of user
export const getClubController = async (req, res, next) => {
  let { id } = req.userData;
  id = mongoose.Types.ObjectId(id);

  // find the club
  try {
    const club = await getClubData({ author: id });
    if (!club)
      return res.status(200).json({
        success: false,
        message: "You don't have a club",
      });

    return res.status(200).json({
      success: true,
      data: club,
      message: "One club found ",
    });
  } catch (err) {
    return next(err);
  }
};

// add player to club
export const postPlayerController = async (req, res, next) => {
  const { id } = req.userData;
  const playerData = req.validData;

  let result;
  try {
    result = await Club.findOneAndUpdate(
      { author: id },
      { $push: { players: playerData } },
      { new: true, rawResult: true }
    );
  } catch (err) {
    return next(err);
  }

  if (result.value._id)
    return res.status(200).json({
      success: true,
      message: "New player added successfully",
    });
  return next(ErrorResponse.badRequest("Can't find your club, login again"));
};

// get all clubs
export const getClubsController = async (req, res, next) => {
  let { page = 1, limit = 10, filter = "" } = req.query;
  const { search = "", sort = "createdAt,-1" } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (filter === "all") filter = "";
  // get all clubs data to display in table
  try {
    const data = await allClubsData({ page, limit, search, sort, filter });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

// update club status
export const patchClubController = async (req, res, next) => {
  const { status, id, comment = "" } = req.body;

  if (!status || !id)
    return next(ErrorResponse.badRequest("Invalid credentials"));

  // change club status
  try {
    const result = await Club.updateOne(
      { _id: id },
      { $set: { status, comment } }
    );

    if (result.modifiedCount)
      return res.status(200).json({
        success: true,
        message: "Club status udpated successfully",
      });

    return next(ErrorResponse.badRequest("Invalid credentials"));
  } catch (err) {
    return next(err);
  }
};
