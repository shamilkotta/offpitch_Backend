import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  payment_id: {
    type: String,
  },
  signature: {
    type: String,
  },
  status: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export default mongoose.model("Transaction", transactionSchema);
