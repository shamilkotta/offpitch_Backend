import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.G_MAIL_USERNAME,
    pass: process.env.G_MAIL_PASS,
  },
});

export default transporter;
