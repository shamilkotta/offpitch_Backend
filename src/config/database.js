/* eslint-disable no-console */
import mongoose from "mongoose";

export default () => {
  const uri = process.env.MONGO_URI || "mongodb://0.0.0.0:27017/offpitch";

  mongoose
    .connect(uri)
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.log(`Database connection failed : ${err}`);
    });
};
