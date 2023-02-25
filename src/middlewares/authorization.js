import jwt from "jsonwebtoken";

import ErrorResponse from "../error/ErrorResponse.js";

export const userAuthorization = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return next(ErrorResponse.unauthorized("Unauthorized"));

  // verify token
  let decode;
  try {
    decode = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return next(ErrorResponse.forbidden("Forbidden"));
  }

  if (!decode.data.email || !decode.data.id)
    return next(ErrorResponse.forbidden("Forbidden"));

  req.userData = decode.data;
  return next();
};

export const adminAuthorization = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return next(ErrorResponse.unauthorized("Unauthorized"));

  // verify token
  let decode;
  try {
    decode = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return next(ErrorResponse.forbidden("Forbidden"));
  }

  if (!decode.data.email || !decode.data.id)
    return next(ErrorResponse.forbidden("Forbidden"));

  if (decode.data.email !== process.env.ADMIN_EMAIL)
    return next(ErrorResponse.forbidden("Unauthorized"));

  req.userData = decode.data;
  return next();
};
