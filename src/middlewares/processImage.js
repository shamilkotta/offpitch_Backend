// eslint-disable-next-line import/no-extraneous-dependencies
import cloudinary from "cloudinary";

import cloudinaryConfig from "../config/cloudinary.js";
import ErrorResponse from "../error/ErrorResponse.js";

const processImage = (req, res, next) => {
  const raw = req.body?.imageData;

  if (!raw) return next(ErrorResponse.badRequest("Image data is not valid"));

  const { signature, public_id: publicId, version } = raw;
  const expectedSignature = cloudinary.v2.utils.api_sign_request(
    { public_id: publicId, version },
    cloudinaryConfig.api_secret
  );

  if (expectedSignature !== signature)
    return next(ErrorResponse.badRequest("Image data is not valid"));

  const url = `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/w_200,h_100,c_fill,q_100/${publicId}.jpg`;
  req.body.imageData = url;
  return next();
  // https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/w_200,h_100,c_fill,q_100/zj4rbidxzvhu2bozdxzj.jpg
};

export default processImage;
