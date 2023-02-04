import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  // requireTLS: true,
  auth: {
    user: process.env.G_MAIL_USERNAME,
    pass: process.env.G_MAIL_APP_PASS,
  },
});

const sendMail = (toEmail, subject, htmlContent) =>
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

export default sendMail;
