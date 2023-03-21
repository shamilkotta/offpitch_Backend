import Match from "../models/match.js";
import Tournament from "../models/tournament.js";

export const scheduleLeague = async ({ id: tournamentId, teams }) => {
  const noTeams = teams.length;
  // adding every teams to group
  const group = {
    name: "Group A",
    no_teams: noTeams,
    teams: [
      ...teams.map((ele, index) => ({
        club: ele.club,
        name: ele.name,
        profile: ele.profile,
        c_position: index,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      })),
    ],
  };

  const result = await Tournament.updateOne(
    { _id: tournamentId },
    { $push: { groups: group } }
  );

  if (!result.modifiedCount)
    return { success: false, message: "Can't schedule match" };

  // generating matches
  const bracket = [...Array(noTeams)].map((_, index) => index);
  const half = Math.ceil(noTeams / 2);
  const poolA = bracket.slice(0, half);
  const poolB = bracket.slice(half).reverse();
  let noRounds = noTeams - 1;

  if (noTeams % 2 !== 0) {
    poolB.push(-1);
    noRounds += 1;
  }

  const rounds = [];
  let i = 0;
  while (i < noRounds) {
    const round = {
      name: `Round ${i + 1}`,
      no_matches: 0,
      round_no: i,
      matches: [],
    };

    let j = 0;
    poolA.forEach((_, ind) => {
      if (poolA[ind] !== -1 && poolB[ind] !== -1) {
        round.no_matches += 1;
        const match = {
          match_no: j,
          teamA: {
            club: group.teams.filter((ele) => ele.c_position === poolA[ind])[0]
              .club,
            name: group.teams.filter((ele) => ele.c_position === poolA[ind])[0]
              .name,
            profile: group.teams.filter(
              (ele) => ele.c_position === poolA[ind]
            )[0].profile,
            goals: -1,
            scorer: [],
          },
          teamB: {
            club: group.teams.filter((ele) => ele.c_position === poolB[ind])[0]
              .club,
            name: group.teams.filter((ele) => ele.c_position === poolB[ind])[0]
              .name,
            profile: group.teams.filter(
              (ele) => ele.c_position === poolB[ind]
            )[0].profile,
            goals: -1,
            scorer: [],
          },
        };
        round.matches.push(match);
        j += 1;
      }
    });

    poolA.splice(1, 0, poolB.shift());
    poolB.push(poolA.pop());

    rounds.push(round);
    i += 1;
  }

  const newMatch = new Match({
    host: tournamentId,
    rounds,
  });
  const matchPost = await newMatch.save();

  if (!matchPost._id)
    return {
      success: false,
      message: "Can't schedule matches",
    };

  return {
    success: true,
    message: "Tournament scheduled successfully",
  };
};

export const scheduleTournament = async ({ id: tournamentId, teams }) => {
  const noTeams = teams.length;
  const lnTeams = Math.log2(noTeams);
  const isPerfect = Number.isInteger(lnTeams);
  const noRounds = Math.ceil(lnTeams);
  const byes = 2 ** noRounds - noTeams;
  const antiByes = noTeams - byes;

  // generating matches
  const rounds = [];

  const getName = (teamCount) => {
    if (teamCount === 8) return "Quarter final";
    if (teamCount === 4) return "Semi final";
    if (teamCount === 2) return "Final";
    return `Round of ${teamCount}`;
  };

  let selectTeam = -1;
  const byeMatches = [];
  let i = 0;
  while (i < noRounds) {
    const round = {
      name: getName(2 ** (noRounds - i)),
      no_matches:
        i === 0 && !isPerfect ? antiByes / 2 : 2 ** (noRounds - i) / 2,
      round_no: i,
      matches: [],
    };

    if (i === 0 && !isPerfect) {
      const actPos = 2 ** noRounds / 4;
      const pos = Math.floor(antiByes / 4);
      const startPos = actPos - pos;

      for (let j = startPos; j < startPos + antiByes / 2; j += 1) {
        byeMatches.push(j);

        const match = {
          match_no: j,
          teamA: {
            club: teams[(selectTeam += 1)].club,
            name: teams[selectTeam].name,
            profile: teams[selectTeam].profile,
            goals: -1,
          },
          teamB: {
            club: teams[(selectTeam += 1)].club,
            name: teams[selectTeam].name,
            profile: teams[selectTeam].profile,
            goals: -1,
          },
        };

        round.matches.push(match);
      }
    } else if (i === 1 && !isPerfect) {
      for (let j = 0; j < round.no_matches; j += 1) {
        let match = {};
        if (byeMatches.includes(j * 2) && byeMatches.includes(j * 2 + 1))
          match = {
            match_no: j,
          };
        else if (byeMatches.includes(j * 2))
          match = {
            match_no: j,
            teamA: {
              club: teams[(selectTeam += 1)].club,
              name: teams[selectTeam].name,
              profile: teams[selectTeam].profile,
              goals: -1,
              scorer: [],
            },
          };
        else if (byeMatches.includes(j * 2 + 1))
          match = {
            match_no: j,
            teamB: {
              club: teams[(selectTeam += 1)].club,
              name: teams[selectTeam].name,
              profile: teams[selectTeam].profile,
              goals: -1,
              scorer: [],
            },
          };
        else
          match = {
            match_no: j,
            teamA: {
              club: teams[(selectTeam += 1)].club,
              name: teams[selectTeam].name,
              profile: teams[selectTeam].profile,
              goals: -1,
              scorer: [],
            },
            teamB: {
              club: teams[(selectTeam += 1)].club,
              name: teams[selectTeam].name,
              profile: teams[selectTeam].profile,
              goals: -1,
              scorer: [],
            },
          };

        round.matches.push(match);
      }
    } else if (i === 0) {
      for (let j = 0; j < round.no_matches; j += 1) {
        const match = {
          match_no: j,
          teamA: {
            club: teams[(selectTeam += 1)].club,
            name: teams[selectTeam].name,
            profile: teams[selectTeam].profile,
            goals: -1,
            scorer: [],
          },
          teamB: {
            club: teams[(selectTeam += 1)].club,
            name: teams[selectTeam].name,
            profile: teams[selectTeam].profile,
            goals: -1,
            scorer: [],
          },
        };

        round.matches.push(match);
      }
    } else {
      for (let j = 0; j < round.no_matches; j += 1) {
        const match = {
          match_no: j,
        };

        round.matches.push(match);
      }
    }

    rounds.push(round);
    i += 1;
  }

  const newMatch = new Match({
    host: tournamentId,
    rounds,
  });
  const matchPost = await newMatch.save();

  if (!matchPost._id)
    return {
      success: false,
      message: "Can't schedule matches",
    };

  return {
    success: true,
    message: "Tournament scheduled successfully",
  };
};

export const getRegistered = async ({ clubId }) => {
  const data = await Tournament.aggregate([
    {
      $match: {
        "teams.club": clubId,
      },
    },
    {
      $project: {
        cover: 1,
        location: 1,
        registration: 1,
        start_date: 1,
        status: 1,
        teams: 1,
        title: 1,
      },
    },
    {
      $unwind: "$teams",
    },
    {
      $match: {
        "teams.club": clubId,
      },
    },
    {
      $addFields: {
        start_date: {
          $concat: [
            { $substr: [{ $dayOfMonth: "$start_date" }, 0, 2] },
            " ",
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$start_date" }, 1] },
                    then: "Jan",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 2] },
                    then: "Feb",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 3] },
                    then: "Mar",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 4] },
                    then: "Apr",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 6] },
                    then: "Jun",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 7] },
                    then: "Jul",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 8] },
                    then: "Aug",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 9] },
                    then: "Sep",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 10] },
                    then: "Oct",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 11] },
                    then: "Nov",
                  },
                  {
                    case: { $eq: [{ $month: "$start_date" }, 12] },
                    then: "Dec",
                  },
                ],
                default: "",
              },
            },
            " ",
            { $substr: [{ $year: "$start_date" }, 0, 4] },
          ],
        },
      },
    },
    {
      $addFields: {
        "registration.last_date": {
          $concat: [
            { $substr: [{ $dayOfMonth: "$registration.last_date" }, 0, 2] },
            " ",
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 1] },
                    then: "Jan",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 2] },
                    then: "Feb",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 3] },
                    then: "Mar",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 4] },
                    then: "Apr",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 6] },
                    then: "Jun",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 7] },
                    then: "Jul",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 8] },
                    then: "Aug",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 9] },
                    then: "Sep",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 10] },
                    then: "Oct",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 11] },
                    then: "Nov",
                  },
                  {
                    case: { $eq: [{ $month: "$registration.last_date" }, 12] },
                    then: "Dec",
                  },
                ],
                default: "",
              },
            },
            " ",
            { $substr: [{ $year: "$registration.last_date" }, 0, 4] },
          ],
        },
      },
    },
  ]);

  return data;
};
