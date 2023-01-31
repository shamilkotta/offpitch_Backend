import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";

// routes
import geustRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import ErrorResponse from "./utils/ErrorResponse.js";
import connectDatbase from "./config/database.js";

dotenv.config();
const app = express();

// body parsers
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// logger
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// database connectoin
connectDatbase();

// api/v1
app.use("/api/v1", geustRouter);

// 404 routes
app.use((req, res, next) => {
  next(new ErrorResponse(404));
});

// error handler
app.use(errorHandler);

export default app;
