// eslint-disable-next-line import/no-extraneous-dependencies
import cloudinary from "cloudinary";

import mongoose from "mongoose";
import ErrorResponse from "../error/ErrorResponse.js";
import Organization from "../models/organization.js";
import cloudinaryConfig from "../config/cloudinary.js";
import Club from "../models/club.js";
import { getClubData, getOrganizationData } from "../helpers/user.js";
import User from "../models/user.js";

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
