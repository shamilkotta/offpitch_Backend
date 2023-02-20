import cloudinary from "cloudinary";
import cloudinaryConfig from "../config/cloudinary.js";

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

// created for avoiding default export
export const hi = "";
