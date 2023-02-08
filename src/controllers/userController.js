import ErrorResponse from "../error/ErrorResponse.js";
import Organization from "../models/organization.js";

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

export default "hi";
