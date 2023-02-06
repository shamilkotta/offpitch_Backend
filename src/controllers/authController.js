import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { authTokens, sendVerificationOtp } from "../helpers/index.js";
import User from "../models/user.js";
import ErrorResponse from "../error/ErrorResponse.js";
import Verification from "../models/verification.js";

export const signupController = async (req, res, next) => {
  const { name, email, password } = req.validData;
  let hashedpass;

  try {
    // checking for duplicate user
    const user = await User.findOne({ email });
    if (user) return next(ErrorResponse.badRequest("Email already registed"));

    // generating password hash
    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    hashedpass = await bcrypt.hash(password, saltRounds);
  } catch (err) {
    return next(err);
  }

  // saving to db
  let savedData;
  try {
    const newUser = new User({
      name,
      email,
      password: hashedpass,
    });
    savedData = await newUser.save();
  } catch (err) {
    if (err.code === 11000)
      return next(ErrorResponse.badRequest("User already registered"));
    return next(err);
  }

  const emailTemplatePath = `./src/utils/otp-verification-email.html`;

  // confirmatoin mail
  try {
    const response = await sendVerificationOtp(emailTemplatePath, email);
    if (response.success)
      return res.status(200).json({
        success: true,
        confirmToken: response.token,
        message:
          "Account created successfully and verifications otp send to your email",
      });
  } catch (err) {
    await User.deleteOne({ email: savedData.email });
    return next(err);
  }
  return next(ErrorResponse.badRequest("Something went wrong"));
};

export const emailVerificationController = async (req, res, next) => {
  const { otp, token } = req.validData;

  // verify token
  let payload;
  try {
    payload = await jwt.verify(token, process.env.OTP_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(ErrorResponse.unauthorized("Invalid otp, generate new one")); // error from token verification
    if (err.name === "JsonWebTokenError" || err.name === "SyntaxError")
      return next(ErrorResponse.unauthorized("Invalid credentils")); // error from token verification
    return next(err);
  }

  // if the otp is ontime and email and otp matches then it will be removed
  let user;
  try {
    const validTime = new Date(new Date() - 60000 * 11);
    const result = await Verification.deleteOne({
      email: payload?.email,
      updatedAt: { $gt: validTime },
      otp,
    });

    if (!result.deletedCount)
      return next(
        ErrorResponse.badRequest(
          "Otp verification failed, try again with new one"
        )
      );

    user = await User.findOneAndUpdate(
      { email: payload.email },
      { $set: { email_verification: "success" } }
    );

    if (!user)
      return next(
        ErrorResponse.badRequest(
          "Otp verification failed, try again with new one"
        )
      );
  } catch (err) {
    return next(err);
  }

  // generating new tokens and sending to user
  try {
    const { accessToken, refreshToken } = await authTokens({
      email: user.email,
    });

    res.cookie("authToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        accessToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const refreshController = async (req, res, next) => {
  const { cookies } = req;
  if (!cookies?.authToken)
    return next(ErrorResponse.unauthorized("Unauthorized"));
  const token = cookies.authToken;

  // validate token
  let decode;
  try {
    decode = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return next(ErrorResponse.forbidden("Forbidden"));
  }

  // find user
  let user;
  try {
    user = await User.findOne({ email: decode.data.email, authToken: token });
    if (!user) return next(ErrorResponse.forbidden("Invalid credentials"));

    const accessToken = jwt.sign(
      { data: { email: user.email } },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: 60 * 10,
      }
    );

    return res.status(200).json({
      success: false,
      message: "token refreshed",
      data: {
        accessToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};
