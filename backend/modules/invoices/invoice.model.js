import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    hsnCode: {
      type: String,
      trim: true,
      default: "",
    },
    mrp: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "piece",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountRate: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    customerSnapshot: {
      name: { type: String, default: "Walk-in Customer" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      gstin: { type: String, default: "" },
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Invoice must contain at least one line item"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    itemDiscountTotal: {
      type: Number,
      default: 0,
    },
    invoiceDiscount: {
      type: { type: String, enum: ["FIXED", "PERCENTAGE"], default: "FIXED" },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PARTIALLY_PAID", "UNPAID"],
      default: "UNPAID",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "CASH",
    },
    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED", "CANCELLED"],
      default: "COMPLETED",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: "",
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
