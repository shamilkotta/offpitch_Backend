/* eslint-disable no-nested-ternary */
import ErrorResponse from "../error/ErrorResponse.js";
import { scheduleLeague, scheduleTournament } from "../helpers/tournament.js";
import Club from "../models/club.js";
import Tournament from "../models/tournament.js";
import Match from "../models/match.js";

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
            status: { $eq: "pending" },
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

export const updateResultController = async (req, res, next) => {
  const { id: tournamentId } = req.params;
  const { id: userId } = req.userData;
  const { teamA, teamB } = req.body;
  let { round_no: roundNo, match_no: matchNo } = req.body;

  // fetch club
  let club;
  try {
    club = await Club.findOne({ author: userId });

    if (!club) return next(ErrorResponse.badRequest("Can't fetch club data"));
  } catch (err) {
    return next(err);
  }

  // fetch tournament
  let tournament;
  try {
    tournament = await Tournament.findOne({
      _id: tournamentId,
      host: club._id,
    });

    if (!tournament)
      return next(ErrorResponse.badRequest("Can't fetch tournament data"));
  } catch (err) {
    return next(err);
  }

  // update match
  let match;
  try {
    match = await Match.findOneAndUpdate(
      { host: tournament._id },
      {
        $set: {
          "rounds.$[round].matches.$[match].teamA.goals": parseInt(teamA, 10),
          "rounds.$[round].matches.$[match].teamB.goals": parseInt(teamB, 10),
        },
      },
      {
        arrayFilters: [
          {
            "round.round_no": roundNo,
          },
          {
            "match.match_no": matchNo,
          },
        ],
        new: true,
        rawResult: true,
      }
    );

    if (!match?.lastErrorObject?.updatedExisting)
      return next(ErrorResponse.badRequest("Can't update result"));

    if (!match?.value?.host)
      return next(ErrorResponse.badRequest("Can't update result"));

    match = match.value;
  } catch (err) {
    return next(err);
  }

  roundNo = parseInt(roundNo, 10);
  matchNo = parseInt(matchNo, 10);
  const current = [roundNo, matchNo];
  const cRound = match?.rounds?.find((ele) => ele.round_no === roundNo);
  const cMatch = cRound?.matches?.find((ele) => ele.match_no === matchNo);

  // update Table
  try {
    if (tournament.tournament_type === "t1") {
      const matchStat =
        cMatch.teamA.goals === cMatch.teamB.goals ? "draw" : "win";
      let winner = null;
      if (matchStat === "win")
        winner =
          cMatch.teamA.goals > cMatch.teamB.goals
            ? cMatch.teamA.club
            : cMatch.teamB.club;

      const teamAg = parseInt(cMatch.teamA.goals, 10);
      const teamBg = parseInt(cMatch.teamB.goals, 10);
      const teamAgd = teamAg - teamBg;
      const teamBgd = teamBg - teamAg;
      const teamApts =
        winner === cMatch.teamA.club ? 3 : winner === null ? 1 : 0;
      const teamBpts =
        winner === cMatch.teamB.club ? 3 : winner === null ? 1 : 0;
      const teamAd = winner === null ? 1 : 0;
      const teamBd = winner === null ? 1 : 0;
      const teamAl = winner === cMatch.teamB.club ? 1 : 0;
      const teamBl = winner === cMatch.teamA.club ? 1 : 0;
      const teamAw = winner === cMatch.teamA.club ? 1 : 0;
      const teamBw = winner === cMatch.teamB.club ? 1 : 0;

      const result = await Tournament.updateOne(
        {
          _id: tournamentId,
          "groups.teams.club": {
            $in: [cMatch.teamA.club, cMatch.teamB.club],
          },
        },
        {
          $inc: {
            "groups.$[group].teams.$[teamA].mp": 1,
            "groups.$[group].teams.$[teamB].mp": 1,
            "groups.$[group].teams.$[teamA].gf": teamAg,
            "groups.$[group].teams.$[teamB].gf": teamBg,
            "groups.$[group].teams.$[teamA].ga": teamBg,
            "groups.$[group].teams.$[teamB].ga": teamAg,
            "groups.$[group].teams.$[teamA].gd": teamAgd,
            "groups.$[group].teams.$[teamB].gd": teamBgd,
            "groups.$[group].teams.$[teamA].pts": teamApts,
            "groups.$[group].teams.$[teamB].pts": teamBpts,
            "groups.$[group].teams.$[teamA].d": teamAd,
            "groups.$[group].teams.$[teamB].d": teamBd,
            "groups.$[group].teams.$[teamA].l": teamAl,
            "groups.$[group].teams.$[teamB].l": teamBl,
            "groups.$[group].teams.$[teamA].w": teamAw,
            "groups.$[group].teams.$[teamB].w": teamBw,
          },
        },
        {
          arrayFilters: [
            { "group.teams.club": cMatch.teamA.club },
            { "teamA.club": cMatch.teamA.club },
            { "teamB.club": cMatch.teamB.club },
          ],
        }
      );

      if (!result.matchedCount)
        return next(ErrorResponse.internalError("Something went wrong"));
    }
  } catch (err) {
    return next(err);
  }

  // update current match
  try {
    if (cRound.no_matches - 1 <= matchNo) {
      if (match?.rounds?.length <= roundNo + 1)
        return res.status(200).json({
          success: true,
          message: "Result updated",
        });

      current[0] = roundNo + 1;
      current[1] = 0;
    } else {
      current[0] = roundNo;
      current[1] = matchNo + 1;
    }

    const result = await Match.updateOne(
      { host: tournament._id },
      { $set: { c_match: current } }
    );

    if (!result.modifiedCount)
      return next(ErrorResponse.internalError("Something went wrong"));

    if (tournament.tournament_type === "t2") {
      const winner = cMatch.teamA.goals > cMatch.teamB.goals ? teamA : teamB;
      winner.scorer = [];
      winner.goals = -1;
      let updateQ = {};
      if ((matchNo / 2) % 1 === 0) {
        updateQ = {
          $set: {
            "rounds.$[round].matches.$[match].teamA": winner,
          },
        };
      } else {
        updateQ = {
          $set: {
            "rounds.$[round].matches.$[match].teamB": winner,
          },
        };
      }

      const tResult = await Match.updateOne({ host: tournament._id }, updateQ, {
        arrayFilters: [
          {
            "round.round_no": roundNo + 1,
          },
          {
            "match.match_no": Math.floor(matchNo / 2),
          },
        ],
      });

      if (!tResult.modifiedCount)
        return next(ErrorResponse.internalError("Something went wrong"));
    }
  } catch (err) {
    return next(err);
  }

  return res.status(200).json({
    success: true,
    message: "Result updated",
  });
};
