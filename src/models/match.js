import mongoose from "mongoose";

const matchSchema = mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    c_match: {
      type: [Number],
      default: [0, 0],
    },
    rounds: [
      {
        name: {
          type: String,
          required: true,
        },
        no_matches: {
          type: Number,
          required: true,
        },
        round_no: {
          type: Number,
          required: true,
        },
        matches: [
          {
            result: {
              type: String,
            },
            match_no: {
              type: Number,
              required: true,
            },
            teamA: {
              club: mongoose.Schema.Types.ObjectId,
              name: String,
              profile: String,
              goals: Number,
              scorer: [mongoose.Schema.Types.ObjectId],
            },
            teamB: {
              club: mongoose.Schema.Types.ObjectId,
              name: String,
              profile: String,
              goals: Number,
              scorer: [mongoose.Schema.Types.ObjectId],
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
