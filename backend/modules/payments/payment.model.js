import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than zero"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "OTHER"],
      default: "CASH",
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ businessId: 1, paymentDate: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
