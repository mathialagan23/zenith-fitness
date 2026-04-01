import mongoose, { Schema } from "mongoose";
import { IDietPlan, IFoodItem, IMeal } from "../types/index.js";

const foodItemSchema = new Schema<IFoodItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    protein: {
      type: Number,
      required: true,
      min: 0,
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const mealSchema = new Schema<IMeal>(
  {
    name: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks"],
    },
    items: {
      type: [foodItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const dietPlanSchema = new Schema<IDietPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Note: index is created below with unique constraint
    },
    meals: {
      type: [mealSchema],
      default: [
        { name: "Breakfast", items: [] },
        { name: "Lunch", items: [] },
        { name: "Dinner", items: [] },
        { name: "Snacks", items: [] },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one diet plan per user
dietPlanSchema.index({ userId: 1 }, { unique: true });

export const DietPlan = mongoose.model<IDietPlan>("DietPlan", dietPlanSchema);
