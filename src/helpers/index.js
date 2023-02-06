/* eslint-disable no-async-promise-executor */
import crypto from "crypto";
import { create } from "express-handlebars";
import jwt from "jsonwebtoken";

import transporter from "../config/nodemailer.js";
import ErrorResponse from "../error/ErrorResponse.js";
import User from "../models/user.js";
import Verification from "../models/verification.js";

// random profile pic genarator to use as default
export const profilePicGenerator = (email) => {
  const hash = crypto.createHash("md5").update(email).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=retro`;
};

// rendering data with html to send over email
export const compileHTMLEmailTemplate = (HTMLTemplatePath, replacements = {}) =>
  new Promise((resolve) => {
    const compiledHTML = create().render(HTMLTemplatePath, replacements);
    resolve(compiledHTML);
  });

// Email sending using nodemailer
export const sendMail = (toEmail, subject, htmlContent) =>
  new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.G_MAIL_USERNAME,
      to: toEmail,
      subject,
      html: htmlContent,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) reject(err);
      else resolve({ success: true, message: "Mail send successfully" });
    });
  });

// sending email verification otp to mail
export const sendVerificationOtp = (email) =>
  new Promise(async (resolve, reject) => {
    // creating otp and save to db
    let otp;
    try {
      otp = Math.floor(100000 + Math.random() * 900000);
      await Verification.updateOne({ email }, { otp }, { upsert: true });
    } catch (err) {
      reject(err);
    }

    // converting otp 12334 => "1 2 3 3 4" for sending as user readable
    const otpString = String(otp)
      .split("")
      .reduce((acc, ele) => `${acc} ${ele}`);

    // reading email template and sending email
    try {
      const emailTemplatePath = `./src/utils/otp-verification-email.html`;
      const emailContent = await compileHTMLEmailTemplate(emailTemplatePath, {
        otp: otpString,
      });

      // send mail
      await sendMail(email, "email verification otp", emailContent);

      // creating token
      const key = process.env.OTP_TOKEN_SECRET;
      const token = jwt.sign({ email }, key, { expiresIn: 60 * 12 });

      resolve({
        success: true,
        token,
        message: "Verification mail send successfully",
      });
    } catch (err) {
      reject(err);
    }
  });

export const authTokens = ({ email }) =>
  new Promise(async (resolve, reject) => {
    try {
      const accessToken = jwt.sign(
        { data: { email } },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: 60 * 10,
        }
      );
      const refreshToken = jwt.sign(
        { data: { email } },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      const res = await User.updateOne(
        { email },
        { $set: { authToken: refreshToken } }
      );

      if (!res.modifiedCount)
        reject(
          ErrorResponse.badRequest(
            "Otp verification failed, try again with new one"
          )
        );
      else resolve({ accessToken, refreshToken });
    } catch (err) {
      reject(err);
    }
  });
