import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";

// routes
import geustRouter from "./routes/index.js";
import errorHandler from "./error/errorHandler.js";
import connectDatbase from "./config/database.js";

dotenv.config();
const app = express();

// enabling cores
app.use(cors());

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
app.use((req, res) => {
  res.status(404).json({ success: false, status: 404, message: "Not found" });
});

// error handler
app.use(errorHandler);

export default app;
