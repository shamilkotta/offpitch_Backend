import jwt from "jsonwebtoken";

import ErrorResponse from "../error/ErrorResponse.js";

const userAuthorization = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return next(ErrorResponse.unauthorized("Unauthorized"));

  // verify token
  let decode;
  try {
    decode = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return next(ErrorResponse.forbidden("Forbidden"));
  }

  req.userData = decode.data;
  return next();
};

export default userAuthorization;
