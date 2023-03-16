import mongoose from "mongoose";

import ErrorResponse from "../error/ErrorResponse.js";
import {
  allTournamentsData,
  findTournamentAuthor,
  getTournamentData,
  verifyPayment,
} from "../helpers/index.js";
import { checkRegistered } from "../helpers/user.js";
import Club from "../models/club.js";
import Tournament from "../models/tournament.js";
import User from "../models/user.js";
import generateInvoice from "../config/razorpay.js";
import Transaction from "../models/transaction.js";

// create and update tournament
export const putTournamentController = async (req, res, next) => {
  const id = req.body?.id || new mongoose.Types.ObjectId();
  const data = req.validData;
  const { id: userId } = req.userData;

  // find club
  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user?.club)
      return next(ErrorResponse.unauthorized("You don't have a club"));
  } catch (err) {
    return next(err);
  }

  // upsert the data into db
  try {
    const response = await Tournament.findOneAndUpdate(
      {
        _id: id,
        host: user.club,
        status: { $nin: ["active", "ended"] },
      },
      { $set: { ...data, host: user.club } },
      { upsert: true, new: true, rawResult: true }
    );

    // return response
    return res.status(200).json({
      success: true,
      message: "Tournament data saved successfully",
      data: {
        id: response.value._id,
        cover: response.value.cover,
      },
    });
  } catch (err) {
    if (err.codeName === "DuplicateKey")
      return next(ErrorResponse.badRequest("You can't edit this tournament"));
    return next(err);
  }
};

// get all tournament of user
export const getUserTournamentsController = async (req, res, next) => {
  const { id } = req.userData;

  // find club
  let result;
  try {
    result = await User.findOne({ _id: id });
    if (!result?.club)
      return next(ErrorResponse.forbidden("Can't find the club"));
  } catch (err) {
    return next(err);
  }

  // get tournament data
  try {
    const data = await Tournament.aggregate([
      {
        $match: {
          host: result.club,
        },
      },
      {
        $addFields: {
          start_date: {
            $dateToString: {
              format: "%m/%d/%Y",
              date: "$start_date",
            },
          },
        },
      },
      {
        $project: {
          cover: 1,
          title: 1,
          short_description: 1,
          location: 1,
          start_date: 1,
          status: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

// get single tournament data of user
export const getUserTournamentController = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.userData;
  if (!id) return next(ErrorResponse.notFound());

  // find club
  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user?.club)
      return next(ErrorResponse.forbidden("You don't have a club"));
  } catch (err) {
    return next(err);
  }

  // find tournament data
  try {
    const tournament = await Tournament.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
          host: user.club,
        },
      },
      {
        $addFields: {
          id: "$_id",
          start_date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$start_date",
            },
          },
          registration_date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$registration_date",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    if (!tournament[0])
      return res.status(200).json({
        success: false,
        message: "Can't find the tournament",
      });

    return res.status(200).json({
      success: true,
      message: "Found one tournament",
      data: tournament[0],
    });
  } catch (err) {
    return next(err);
  }
};

// get all tournaments for guest user
export const getTournamentsController = async (req, res, next) => {
  let { page = 1, limit = 25, filter = "" } = req.query;
  const { search = "", sort = "createdAt,-1" } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (filter === "all") filter = "";

  // get all clubs data to display in table
  try {
    const data = await allTournamentsData({
      page,
      limit,
      search,
      sort,
      filter,
      userId: req?.userData?.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

// get tournament data
export const getTournamentController = async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(ErrorResponse.notFound());

  // find tournament data
  let tournament;
  try {
    tournament = await getTournamentData({ id });

    if (!tournament)
      return res.status(200).json({
        success: false,
        message: "Can't find the tournament",
      });
  } catch (err) {
    return next(err);
  }

  // fetch is registered
  try {
    if (req?.userData?.id) {
      const isRegistered = await checkRegistered({
        userId: req.userData.id,
        id,
      });
      tournament.isRegistered = isRegistered;
    }
  } catch (err) {
    return next(err);
  }

  // check user is host
  try {
    if (req?.userData?.id) {
      const author = await findTournamentAuthor(id);
      tournament.isHost = req.userData.id === author.toString();
    }

    return res.status(200).json({
      success: true,
      message: "Found one tournament",
      data: tournament,
    });
  } catch (err) {
    return next(err);
  }
};

// register controller
export const tournamentRegisterController = async (req, res, next) => {
  const { players } = req.body;
  const { id: tournament } = req.params;

  if (!players) return next(ErrorResponse.badRequest("Please select players"));

  // check is club is active
  let club;
  try {
    club = await Club.findOne({ author: req.userData.id, status: "active" });
    if (!club)
      return next(ErrorResponse.unauthorized("You don't have a active club"));
  } catch (err) {
    return next(err);
  }

  // check registered
  try {
    const isRegistered = await checkRegistered({
      userId: req.userData.id,
      id: tournament,
    });
    if (isRegistered)
      return next(ErrorResponse.badRequest("Your are already registered"));
  } catch (err) {
    return next(err);
  }

  // validate players
  try {
    const {
      min_no_players: minPlayer,
      registration,
      max_no_players: maxPlayer,
    } = await getTournamentData({ id: tournament });

    if (players.length < minPlayer || players.length > maxPlayer)
      return next(
        ErrorResponse.badRequest("Please select valid number of players")
      );

    if (registration.last_date < new Date()) {
      return next(ErrorResponse.badRequest("Registration closed"));
    }

    if (registration.status !== "open")
      return next(
        ErrorResponse.badRequest("Sorry, registration is already closed")
      );
  } catch (err) {
    return next(err);
  }

  // register
  try {
    const data = {
      club: club._id,
      name: club.name,
      profile: club.profile,
      players: [...players],
      status: "pending",
    };

    const result = await Tournament.updateOne(
      { _id: tournament },
      { $push: { teams: data } }
    );

    if (!result.modifiedCount)
      return next(ErrorResponse.internalError("Something went wrong"));

    req.club = club;
    return next();
  } catch (err) {
    return next(err);
  }
};

export const getTournamentInvoice = async (req, res, next) => {
  const { id: tournament } = req.params;
  const { _id: club } = req.club;

  // fetch tournament
  let registerFee;
  try {
    registerFee = await Tournament.findOne(
      { _id: tournament },
      { registration: 1, host: 1 }
    );

    if (!registerFee?._id)
      return next(ErrorResponse.badRequest("Partial completion"));
  } catch (err) {
    return next(ErrorResponse.internalError("Partial completion"));
  }

  try {
    if (!registerFee?.registration?.fee?.is) {
      const result = await Tournament.updateOne(
        { _id: tournament, "teams.club": club },
        { $set: { "teams.$.status": "paid" } }
      );

      if (!result.modifiedCount)
        return next(ErrorResponse.internalError("Partial completion"));

      return res.status(200).json({
        success: true,
        message: "Your registration is successfull",
        data: {
          amount: 0,
        },
      });
    }
  } catch (err) {
    return next(ErrorResponse.internalError("Partial completion"));
  }

  // generate invoice
  let invoiceData;
  try {
    invoiceData = await generateInvoice(registerFee?.registration?.fee?.amount);
  } catch (err) {
    return next(ErrorResponse.internalError("Partial completion"));
  }

  // sending response
  try {
    if (invoiceData?.success) {
      // saving transaction
      const newTransc = new Transaction({
        from: club,
        to: registerFee.host,
        amount: registerFee?.registration?.fee?.amount,
        order_id: invoiceData?.order?.id,
      });
      await newTransc.save();
      return res.status(200).json({
        success: true,
        message: "Invoice generated successfully",
        data: {
          amount: registerFee?.registration?.fee?.amount,
          order_id: invoiceData?.order.id,
        },
      });
    }
  } catch (err) {
    return next(ErrorResponse.internalError("Partial completion"));
  }

  return next(ErrorResponse.internalError("Partial completion"));
};

export const postRegistrationFee = async (req, res, next) => {
  const { id: tournament } = req.params;
  const { id: userId } = req.userData;
  const {
    razorpay_payment_id: paymentId,
    razorpay_order_id: inOrderId,
    razorpay_signature: signature,
  } = req.body;

  // fetch club
  let club;
  try {
    club = await Club.findOne({
      author: userId,
    });

    if (!club)
      return next(
        ErrorResponse.badRequest("Can't fetch your club details, try again")
      );
  } catch (err) {
    return next(err);
  }

  // fetch invoice
  let transaction;
  try {
    transaction = await Transaction.findOne({ order_id: inOrderId });

    if (!transaction)
      return next(ErrorResponse.forbidden("Verification failed"));
  } catch (err) {
    return next(err);
  }

  // verify payment
  try {
    const result = await verifyPayment(
      paymentId,
      transaction.order_id,
      signature
    );

    if (!result) return next(ErrorResponse.forbidden("Verification failed"));
  } catch (err) {
    return next(ErrorResponse.internalError("Verification failed"));
  }

  // update registration data
  try {
    const result = await Tournament.updateOne(
      { _id: tournament, "teams.club": club },
      { $set: { "teams.$.status": "paid" } }
    );

    if (!result.modifiedCount)
      return next(ErrorResponse.internalError("Something went wrong"));
  } catch (err) {
    return next(err);
  }

  // update payment status
  let transactionData;
  try {
    transactionData = await Transaction.findOneAndUpdate(
      { order_id: inOrderId },
      { $set: { status: true } },
      { new: true, rawResult: true }
    );

    if (!transactionData?.lastErrorObject?.updatedExisting)
      return next(ErrorResponse.internalError("Something went wrong"));
  } catch (err) {
    return next(err);
  }

  // find tournament host
  let tournamentHost;
  try {
    tournamentHost = await findTournamentAuthor(tournament);
  } catch (err) {
    return next(err);
  }

  // update host wallet
  try {
    const amount = transactionData?.value?.amount || 0;
    await User.updateOne({ _id: tournamentHost }, { $inc: { wallet: amount } });
  } catch (err) {
    return next(err);
  }

  return res.status(200).json({
    success: true,
    message: "Registration successful",
  });
};

export const saveToWatchlistController = async (req, res, next) => {
  const { id: userId } = req.userData;
  const { id: tournamentId } = req.params;
  // saving to watchlist
  try {
    const result = await User.updateOne(
      { _id: userId },
      { $addToSet: { watchlist: mongoose.Types.ObjectId(tournamentId) } }
    );

    if (!result.modifiedCount)
      return next(ErrorResponse.badRequest("Can't add to watchlist"));
  } catch (err) {
    return next(err);
  }

  return res.status(200).json({
    success: true,
    message: "Added to wathclist",
  });
};
