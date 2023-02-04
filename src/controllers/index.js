import bcrypt from "bcrypt";

import { sendVerificationOtp } from "../helpers/index.js";
import User from "../models/user.js";
import ErrorResponse from "../error/ErrorResponse.js";

const signupController = async (req, res, next) => {
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
      status: "confirmation pending",
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

export default signupController;
