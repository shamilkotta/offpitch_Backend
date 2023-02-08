// eslint-disable-next-line import/no-extraneous-dependencies
import cloudinary from "cloudinary";

import ErrorResponse from "../error/ErrorResponse.js";
import Organization from "../models/organization.js";
import cloudinaryConfig from "../config/cloudinary.js";
import Club from "../models/club.js";

// Create or update a organization page
export const postOrganizationController = async (req, res, next) => {
  const { id } = req.userData;
  const organizationData = req.validData;

  // save data to db
  let result;
  try {
    result = await Organization.updateOne(
      { author: id },
      { $set: { ...organizationData } },
      { upsert: true }
    );
  } catch (err) {
    return next(err);
  }

  if (result.modifiedCount || result.upsertedCount)
    return res
      .status(200)
      .json({ success: true, message: "Organization updated successfully" });

  return next(ErrorResponse.badRequest("Something went wrong"));
};

// generate signature for image upload
export const imageSignatureController = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.v2.utils.api_sign_request(
    {
      timestamp,
    },
    cloudinaryConfig.api_secret
  );
  res.status(200).json({ success: true, data: { timestamp, signature } });
};

// Create or update a organization page
export const postClubController = async (req, res, next) => {
  const { id } = req.userData;
  const clubData = req.validData;

  // save data to db
  let result;
  try {
    result = await Club.updateOne(
      { author: id },
      { $set: { ...clubData } },
      { upsert: true }
    );
  } catch (err) {
    return next(err);
  }

  if (result.modifiedCount || result.upsertedCount)
    return res
      .status(200)
      .json({ success: true, message: "Club updated successfully" });

  return next(ErrorResponse.badRequest("Something went wrong"));
};

export const getClubController = async (req, res, next) => {
  const { id } = req.userData;

  // find the club
  try {
    const club = await Club.findOne({ author: id }).exec();
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
