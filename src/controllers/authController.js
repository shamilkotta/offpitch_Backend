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

  // confirmatoin mail
  try {
    const response = await sendVerificationOtp(email);
    if (response.success)
      return res.status(200).json({
        success: true,
        data: {
          confirmToken: response.token,
        },
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
      token,
      updatedAt: { $gt: validTime },
      otp,
    });

    if (!result.deletedCount)
      return next(ErrorResponse.badRequest("Invalid otp, generate new one"));

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
      id: user._id,
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
        name: user.name,
        email: user.email,
        profile: user.profile_pic,
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
      success: true,
      message: "token refreshed",
      data: {
        name: user.name,
        email: user.email,
        profile: user.profile_pic,
        accessToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const loginController = async (req, res, next) => {
  const { email, password } = req.validData;

  // find user
  let user;
  try {
    user = await User.findOne({ email });
    // invalid email
    if (!user)
      return next(ErrorResponse.badRequest("Invalid email or passwrod"));

    const match = await bcrypt.compare(password, user.password);
    // invalid password
    if (!match)
      return next(ErrorResponse.badRequest("Invalid email or passwrod"));
  } catch (err) {
    return next(err);
  }

  // blocked account
  if (user?.status === "blocked")
    return next(
      ErrorResponse.forbidden("This account is blocked, contact support center")
    );

  // email vaerification pending
  if (user?.email_verification === "pending") {
    // confirmatoin mail
    try {
      const response = await sendVerificationOtp(email);
      if (response.success)
        return res.status(200).json({
          success: false,
          data: {
            confirmToken: response.token,
          },
          message: "Email verification is pending",
        });
      return next(ErrorResponse.internalError("Something went wrong"));
    } catch (err) {
      return next(err);
    }
  }

  // generating new tokens and sending to user
  try {
    const { accessToken, refreshToken } = await authTokens({
      email: user.email,
      id: user._id,
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
        name: user.name,
        email: user.email,
        profile: user.profile_pic,
        accessToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const resendController = async (req, res, next) => {
  const { token } = req.params;

  if (!token)
    return next(
      ErrorResponse.badRequest("Invalid credentials, try login again")
    );

  const currentTime = Date.now();

  // verify token
  let payload;
  try {
    payload = await jwt.verify(token, process.env.OTP_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(ErrorResponse.unauthorized("Unauthorized, try login again")); // error from token verification
    if (err.name === "JsonWebTokenError" || err.name === "SyntaxError")
      return next(ErrorResponse.unauthorized("Invalid credentials")); // error from token verification
    return next(err);
  }

  try {
    const getDoc = await Verification.findOne({
      email: payload?.email,
      token,
    });
    if (!getDoc) return next(ErrorResponse.forbidden("Invalid credentials"));
  } catch (err) {
    return next(err);
  }

  // checking is atleast 1 min gap between old otp
  if ((currentTime - payload.iat * 1000) / 60000 <= 1)
    return res.status(200).json({
      success: false,
      message: "Try after some time",
    });

  // sendin otp again to mail
  try {
    const response = await sendVerificationOtp(payload?.email);
    if (response.success)
      return res.status(200).json({
        success: true,
        data: {
          confirmToken: response.token,
        },
        message: "Otp sent to your email",
      });
    return next(ErrorResponse.internalError("Something went wrong"));
  } catch (err) {
    return next(err);
  }
};

export const logoutController = async (req, res, next) => {
  const { cookies } = req;
  if (!cookies.authToken)
    return res.status(204).json({
      success: true,
      message: "Logged out successfully",
    });

  const decode = jwt.decode(cookies.authToken);
  if (decode?.data?.email) {
    try {
      await User.updateOne(
        {
          email: decode.data.email,
          authToken: cookies.authToken,
        },
        { $set: { authToken: "" } }
      );
    } catch (err) {
      return next(err);
    }
  }

  res.clearCookie("authToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
