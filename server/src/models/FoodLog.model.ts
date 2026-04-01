import mongoose, { Schema } from "mongoose";
import { IFoodLog, IPlannedMealLog, IExtraFoodItem, IFoodItem } from "../types/index.js";

// Base food item schema
const foodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// Planned meal log schema (meals from the plan with status)
const plannedMealLogSchema = new Schema<IPlannedMealLog>(
  {
    mealName: { type: String, required: true },
    status: {
      type: String,
      enum: ["eaten", "skipped", "pending"],
      default: "pending",
    },
    items: { type: [foodItemSchema], default: [] },
  },
  { _id: false }
);

// Extra food item schema (items not in the plan)
const extraFoodItemSchema = new Schema<IExtraFoodItem>(
  {
    name: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    mealContext: { type: String, trim: true }, // e.g., "with lunch", "snack", "post-workout"
  },
  { _id: false }
);

const foodLogSchema = new Schema<IFoodLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Note: index is created below with compound indexes
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    plannedMeals: {
      type: [plannedMealLogSchema],
      default: [],
    },
    extraItems: {
      type: [extraFoodItemSchema],
      default: [],
    },
    waterIntake: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries by user and date
foodLogSchema.index({ userId: 1, date: -1 });

// Ensure one log per user per day
foodLogSchema.index(
  { userId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { date: { $exists: true } },
  }
);

// Virtual to calculate total consumed macros
foodLogSchema.virtual("totals").get(function () {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Add eaten planned meals
  for (const meal of this.plannedMeals) {
    if (meal.status === "eaten") {
      for (const item of meal.items) {
        totals.calories += item.calories;
        totals.protein += item.protein;
        totals.carbs += item.carbs;
        totals.fat += item.fat;
      }
    }
  }

  // Add extra items
  for (const item of this.extraItems) {
    totals.calories += item.calories;
    totals.protein += item.protein;
    totals.carbs += item.carbs;
    totals.fat += item.fat;
  }

  return totals;
});

// Enable virtuals in JSON output
foodLogSchema.set("toJSON", { virtuals: true });
foodLogSchema.set("toObject", { virtuals: true });

export const FoodLog = mongoose.model<IFoodLog>("FoodLog", foodLogSchema);
