import crypto from "crypto";
import { create } from "express-handlebars";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Tournament from "../models/tournament.js";
import transporter from "../config/nodemailer.js";
import ErrorResponse from "../error/ErrorResponse.js";
import User from "../models/user.js";
import Verification from "../models/verification.js";
import Admin from "../models/admin.js";

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
export const sendVerificationOtp = async (email) => {
  // creating token
  const key = process.env.OTP_TOKEN_SECRET;
  const token = jwt.sign({ email }, key, { expiresIn: 60 * 12 });

  // creating otp and save to db
  const otp = Math.floor(100000 + Math.random() * 900000);
  await Verification.updateOne({ email }, { otp, token }, { upsert: true });

  // converting otp 12334 => "1 2 3 3 4" for sending as user readable
  const otpString = String(otp)
    .split("")
    .reduce((acc, ele) => `${acc} ${ele}`);

  // reading email template and sending email
  const emailTemplatePath = `./src/utils/otp-verification-email.html`;
  const emailContent = await compileHTMLEmailTemplate(emailTemplatePath, {
    otp: otpString,
  });

  // send mail
  await sendMail(email, "email verification otp", emailContent);

  return {
    success: true,
    token,
    message: "Verification mail send successfully",
  };
};

export const authTokens = async ({ email, id, role = "user" }) => {
  let model;
  if (role === "admin") model = Admin;
  else model = User;

  const accessToken = jwt.sign(
    { data: { email, id } },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: 60 * 10,
    }
  );
  const refreshToken = jwt.sign(
    { data: { email, id } },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );

  const res = await model.updateOne(
    { email },
    { $set: { authToken: refreshToken } }
  );

  if (!res.modifiedCount)
    throw ErrorResponse.badRequest("Something went wrong, try again");
  else return { accessToken, refreshToken };
};

// all tournaments
export const allTournamentsData = async ({
  page = 1,
  limit = 25,
  search = "",
  sort = "createdAt,-1",
  filter = "",
}) => {
  const currentPage = page - 1;
  const sortOptions = sort.split(",");

  const sortBy = {};
  if (sortOptions[1] && sortOptions[1] === "1") sortBy[sortOptions[0]] = 1;
  else sortBy[sortOptions[0]] = -1;

  const reslut = await Tournament.aggregate([
    {
      $match: {
        status: { $ne: "draft" },
      },
    },
    // filter
    {
      $match: {
        status: { $regex: filter, $options: "i" },
      },
    },

    {
      $project: {
        cover: 1,
        title: 1,
        host: 1,
        short_description: 1,
        location: 1,
        start_date: 1,
        status: 1,
      },
    },
    {
      $lookup: {
        from: "clubs",
        foreignField: "_id",
        localField: "host",
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
            },
          },
        ],
        as: "host",
      },
    },
    {
      $unwind: "$host",
    },
    // search
    {
      $match: {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { short_description: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { tournament_type: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { "host.name": { $regex: search, $options: "i" } },
        ],
      },
    },
    {
      $addFields: {
        start_date: {
          $concat: [
            { $substr: [{ $dayOfMonth: "$start_date" }, 0, 2] },
            " ",
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$start_date" }, 1] },
                    then: "Jan",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 2] },
                    then: "Feb",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 3] },
                    then: "Mar",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 4] },
                    then: "Apr",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 6] },
                    then: "Jun",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 7] },
                    then: "Jul",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 8] },
                    then: "Aug",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 9] },
                    then: "Sep",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 10] },
                    then: "Oct",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 11] },
                    then: "Nov",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 12] },
                    then: "Dec",
                  },
                ],
                default: "",
              },
            },
            " ",
            { $substr: [{ $year: "$start_date" }, 0, 4] },
          ],
        },
      },
    },
    // sort
    {
      $sort: sortBy,
    },
    // transforming results
    {
      $facet: {
        allTournaments: [
          {
            $skip: currentPage * limit,
          },
          {
            $limit: limit,
          },
        ],
        total: [{ $count: "total" }],
      },
    },
    {
      $unwind: {
        path: "$total",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        total: "$total.total",
        page: currentPage + 1,
        limit,
      },
    },
  ]);
  return reslut[0];
};

export const getTournamentData = async ({ id }) => {
  const tournament = await Tournament.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(id),
      },
    },
    {
      $addFields: {
        start_date: {
          $concat: [
            { $substr: [{ $dayOfMonth: "$start_date" }, 0, 2] },
            " ",
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$start_date" }, 1] },
                    then: "January",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 2] },
                    then: "February",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 3] },
                    then: "March",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 4] },
                    then: "April",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 6] },
                    then: "June",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 7] },
                    then: "July",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 8] },
                    then: "August",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 9] },
                    then: "September",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 10] },
                    then: "October",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 11] },
                    then: "November",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 12] },
                    then: "December",
                  },
                ],
                default: "",
              },
            },
            " ",
            { $substr: [{ $year: "$start_date" }, 0, 4] },
          ],
        },
        registration_date: {
          $dateToString: {
            format: "%d/%m/%Y",
            date: "$registration_date",
          },
        },
      },
    },
    {
      $lookup: {
        from: "clubs",
        foreignField: "_id",
        localField: "host",
        pipeline: [
          {
            $project: {
              name: 1,
              profile: 1,
              email: 1,
              phone: 1,
            },
          },
        ],
        as: "host",
      },
    },
    {
      $unwind: "$host",
    },
  ]);
  return tournament[0];
};

export const verifyPayment = async (paymentId, orderId, signature) => {
  const generatedSignature = crypto
    .createHmac("SHA256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};
