import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    cover: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    short_description: {
      type: String,
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    instruction: {
      type: String,
      required: true,
      default: "",
    },
    no_teams: {
      type: Number,
      required: true,
      default: 0,
    },
    registration_date: {
      type: Date,
      required: true,
    },
    min_no_players: {
      type: Number,
      required: true,
      default: 0,
    },
    max_no_players: {
      type: Number,
      required: true,
      default: 0,
    },
    registration_status: {
      type: Boolean,
      required: true,
      default: true,
    },
    registration_fee: {
      is: {
        type: Boolean,
        required: true,
        default: false,
      },
      amount: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    tickets: {
      matchday_ticket: {
        is: {
          type: Boolean,
          required: true,
          default: false,
        },
        amount: {
          type: Number,
          required: true,
          default: 0,
        },
        total: {
          type: Number,
          required: true,
          default: 0,
        },
      },
      season_ticket: {
        is: {
          type: Boolean,
          required: true,
          default: false,
        },
        amount: {
          type: Number,
          required: true,
          default: 0,
        },
        total: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    },
    tournament_type: {
      type: String,
      required: true,
      default: "t1",
    },
    teams: [
      {
        club: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        players: [
          {
            type: String,
            required: true,
          },
        ],
        status: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      default: "draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tournament", tournamentSchema);
