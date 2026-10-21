import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, "Purchase price cannot be negative"],
    },
    unit: {
      type: String,
      default: "piece",
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, "Tax rate cannot be negative"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ businessId: 1, name: "text", sku: "text" });

export const Product = mongoose.model("Product", productSchema);
