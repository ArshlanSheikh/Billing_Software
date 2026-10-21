import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    totalBilled: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

customerSchema.index({ businessId: 1, phone: 1 });
customerSchema.index({ businessId: 1, name: "text" });

export const Customer = mongoose.model("Customer", customerSchema);
