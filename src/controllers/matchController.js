import ErrorResponse from "../error/ErrorResponse.js";
import { scheduleLeague, scheduleTournament } from "../helpers/tournament.js";
import Club from "../models/club.js";
import Tournament from "../models/tournament.js";

export const scheduelMatchesController = async (req, res, next) => {
  const { id: tournamentId } = req.params;
  const { id: userId } = req.userData;

  // find club
  let club;
  try {
    club = await Club.findOne({ author: userId });
    if (!club) return next(ErrorResponse.badRequest("Unauthorized"));
  } catch (err) {
    return next(err);
  }

  // find tournament and remove unpaid clubs
  let tournament;
  try {
    tournament = await Tournament.findOneAndUpdate(
      {
        _id: tournamentId,
        host: club._id,
        "registration.last_date": { $lt: new Date() },
        "registration.status": "open",
      },
      {
        $pull: {
          teams: {
            status: { $eq: "pending1" },
          },
        },
      },
      {
        new: true,
      }
    );

    if (!tournament)
      return next(ErrorResponse.badRequest("Couldn't schedule the tournament"));
  } catch (err) {
    return next(err);
  }

  // schedule tournament
  let result;
  try {
    if (tournament.tournament_type === "t1")
      result = await scheduleLeague({
        id: tournamentId,
        teams: tournament.teams,
      });
    if (tournament.tournament_type === "t2")
      result = await scheduleTournament({
        id: tournamentId,
        teams: tournament.teams,
      });
    // if (tournament.tournament_type === "t3") scheduleGroup();

    if (!result.success)
      return next(ErrorResponse.internalError(result.message));
  } catch (err) {
    return next(err);
  }

  // change registration status
  try {
    await Tournament.updateOne(
      { _id: tournamentId },
      { $set: { "registration.status": "scheduled" } }
    );
  } catch (err) {
    return next(err);
  }

  return res.status(200).json({
    success: true,
    message: "Tournament scheduled successfully",
  });
};

export const hi = "";
