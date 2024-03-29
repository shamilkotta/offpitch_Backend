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
    registration: {
      last_date: {
        type: Date,
        required: true,
      },
      fee: {
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
      status: {
        type: String,
        required: true,
        default: "open",
      },
    },
    ticket: {
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
        profile: {
          type: String,
          required: true,
        },
        players: [
          {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
        ],
        status: {
          type: String,
          required: true,
        },
      },
    ],
    groups: [
      {
        name: {
          type: String,
          required: true,
        },
        no_teams: {
          type: Number,
          requried: true,
          default: 0,
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
            profile: {
              type: String,
              required: true,
            },
            c_position: {
              type: Number,
              required: true,
            },
            mp: {
              type: Number,
              required: true,
              default: 0,
            },
            w: {
              type: Number,
              required: true,
              default: 0,
            },
            d: {
              type: Number,
              required: true,
              default: 0,
            },
            l: {
              type: Number,
              required: true,
              default: 0,
            },
            gf: {
              type: Number,
              required: true,
              default: 0,
            },
            ga: {
              type: Number,
              required: true,
              default: 0,
            },
            gd: {
              type: Number,
              required: true,
              default: 0,
            },
            pts: {
              type: Number,
              required: true,
              default: 0,
            },
          },
        ],
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
