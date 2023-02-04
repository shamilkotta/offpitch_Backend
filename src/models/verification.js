import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Verification", verificationSchema);
