import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    type: {
      type: String,
      default: "Retail",
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
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
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    logoUrl: {
      type: String,
      default: "",
    },
    currency: {
      code: { type: String, default: "INR" },
      symbol: { type: String, default: "₹" },
    },
    invoiceSettings: {
      prefix: { type: String, default: "INV-" },
      startingNumber: { type: Number, default: 1 },
      currentNumber: { type: Number, default: 0 },
      termsAndConditions: {
        type: String,
        default: "1. Goods once sold will not be taken back without original bill.\n2. Payment is due as per agreed terms.",
      },
      footerNote: {
        type: String,
        default: "Thank you for your business!",
      },
    },
    taxSettings: {
      taxType: { type: String, default: "GST" },
      defaultTaxRate: { type: Number, default: 18 },
      isTaxInclusive: { type: Boolean, default: false },
    },
    isConfigured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Business = mongoose.model("Business", businessSchema);
