import mongoose from "mongoose";
import { profilePicGenerator } from "../helpers/index.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    profile_pic: {
      type: String,
      required: true,
      default() {
        return profilePicGenerator(this.email);
      },
      trim: true,
    },
    watchlist: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
