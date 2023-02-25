import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// config env;
import "dotenv/config";

// routes
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import adminRoute from "./routes/adminRoute.js";

import errorHandler from "./error/errorHandler.js";
import connectDatbase from "./config/database.js";
import cors from "./middlewares/cors.js";
import {
  userAuthorization,
  adminAuthorization,
} from "./middlewares/authorization.js";

const app = express();

// enabling cores
app.use(cors);

// body parsers
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// logger
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// database connectoin
connectDatbase();

// api
app.use("/api/auth", authRoute);
app.use("/api/user", userAuthorization, userRoute);
app.use("/api/admin", adminAuthorization, adminRoute);

// 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, status: 404, message: "Not found" });
});

// error handler
app.use(errorHandler);

export default app;
