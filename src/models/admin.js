import mongoose from "mongoose";
import { profilePicGenerator } from "../helpers/index.js";

const adminSchema = new mongoose.Schema(
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
    profile: {
      type: String,
      required: true,
      default() {
        return profilePicGenerator(this.email);
      },
      trim: true,
    },
    authToken: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: true,
      default: "admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
