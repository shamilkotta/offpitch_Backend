import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    profile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    players: {
      type: [
        new mongoose.Schema({
          name: {
            type: String,
            required: true,
          },
          date_of_birth: {
            type: Date,
            required: true,
          },
          profile: {
            type: String,
            required: true,
          },
          status: {
            type: String,
            required: true,
            default: "active",
          },
        }),
      ],
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
    },
    status: {
      type: String,
      required: true,
      default: "awaiting",
    },
    comment: {
      type: String,
      required: false,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Club", clubSchema);
