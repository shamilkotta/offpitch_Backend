// eslint-disable-next-line import/no-extraneous-dependencies
import cloudinary from "cloudinary";
import mongoose from "mongoose";

import ErrorResponse from "../error/ErrorResponse.js";
import Organization from "../models/organization.js";
import cloudinaryConfig from "../config/cloudinary.js";
import Club from "../models/club.js";
import { getClubData, getOrganizationData } from "../helpers/user.js";
import User from "../models/user.js";
import Tournament from "../models/tournament.js";

// Create or update a organization page
export const putOrganizationController = async (req, res, next) => {
  const { id } = req.userData;
  const organizationData = req.validData;

  // save data to db
  let result;
  try {
    result = await Organization.findOneAndUpdate(
      { author: id },
      { $set: { ...organizationData } },
      { upsert: true, new: true, rawResult: true }
    );
  } catch (err) {
    return next(err);
  }

  if (!result.value._id)
    return next(ErrorResponse.badRequest("Something went wrong"));

  // if updated then send response
  if (result.lastErrorObject.updatedExisting)
    return res.status(200).json({
      success: true,
      message: "Organization data updated successfully",
      data: result,
    });

  // if upserted then save id to user profile
  try {
    const response = await User.updateOne(
      { _id: id },
      { $set: { organization: result.value._id } }
    );

    if (response.modifiedCount)
      return res.status(200).json({
        success: true,
        message: "New organization created successfully",
      });

    return next(ErrorResponse.badRequest("Something went wrong"));
  } catch (err) {
    return next(err);
  }
};

// generate signature for image upload
export const imageSignatureController = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  // const expiration = Math.round(new Date().getTime() / 1000) + 1200;
  const signature = cloudinary.v2.utils.api_sign_request(
    {
      timestamp,
      folder: "offpitch",
      // max_calls: 10, // maximum number of requests in a 120-second period
      // max_seconds: 60, // time period (in 2 seconds)
    },
    cloudinaryConfig.api_secret
  );
  res.status(200).json({ success: true, data: { timestamp, signature } });
};

// Create or update a organization page
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

  // if updated then send response
  if (result.lastErrorObject.updatedExisting)
    return res.status(200).json({
      success: true,
      message: "Club data updated successfully",
      data: result,
    });

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

export const getOrganizationController = async (req, res, next) => {
  let { id } = req.userData;
  id = mongoose.Types.ObjectId(id);

  // find the org
  try {
    const club = await getOrganizationData({ author: id });
    if (!club)
      return res.status(200).json({
        success: false,
        message: "You don't have a organization",
      });

    return res.status(200).json({
      success: true,
      data: club,
      message: "One organization found ",
    });
  } catch (err) {
    return next(err);
  }
};

export const putTournamentController = async (req, res, next) => {
  const id = req.body?.id || new mongoose.Types.ObjectId();
  const data = req.validData;
  const { id: userId } = req.userData;

  // find organization
  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user?.organization)
      return next(ErrorResponse.unauthorized("You don't have a organization"));
  } catch (err) {
    return next(err);
  }

  // upsert the data into db
  try {
    const response = await Tournament.findOneAndUpdate(
      {
        _id: id,
        host: user.organization,
        status: { $nin: ["active", "ended"] },
      },
      { $set: { ...data, host: user.organization } },
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

  // find org
  let result;
  try {
    result = await User.findOne({ _id: id });
    if (!result?.organization)
      return next(ErrorResponse.forbidden("Can't find the organization"));
  } catch (err) {
    return next(err);
  }

  // get tournament data
  try {
    const data = await Tournament.aggregate([
      {
        $match: {
          host: result.organization,
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

// get data about the tournament
export const getTournamentController = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.userData;
  if (!id) return next(ErrorResponse.notFound());

  // find organization
  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user?.organization)
      return next(ErrorResponse.forbidden("You don't have a organization"));
  } catch (err) {
    return next(err);
  }

  // find tournament data
  try {
    const tournament = await Tournament.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
          host: user.organization,
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
