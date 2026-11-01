const mongoose = require("mongoose");

const foodListingSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["cooked_meal", "bakery", "produce", "packaged", "other"],
      default: "cooked_meal",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    unit: {
      type: String,
      enum: ["servings", "kg", "plates", "packets"],
      default: "servings",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    pickupWindowStart: {
      type: Date,
      required: true,
    },
    pickupWindowEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "claimed", "expired"],
      default: "available",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodListing", foodListingSchema);
