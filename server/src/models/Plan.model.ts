import mongoose, { Schema } from "mongoose";
import {
  IPlan,
  IPlanMeal,
  IFoodItem,
  IPlanExercise,
  IWorkoutDayType,
  IWeeklySchedule,
  IPlanTargets,
  ExerciseType,
} from "../types/index.js";

// Food item schema (reused)
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

// Plan meal schema (with custom names and optional time)
const planMealSchema = new Schema<IPlanMeal>(
  {
    name: { type: String, required: true, trim: true },
    time: { type: String, trim: true },
    items: { type: [foodItemSchema], default: [] },
  },
  { _id: false }
);

// Exercise schema for workout plan - DECOUPLED from weight
const planExerciseSchema = new Schema<IPlanExercise>(
  {
    name: { type: String, required: true, trim: true },
    targetSets: { type: Number, required: true, min: 1 },
    targetReps: { type: String, required: true, trim: true }, // Now a string for rep ranges
    exerciseType: { 
      type: String, 
      enum: ["compound", "isolation", "bodyweight"] as ExerciseType[],
      default: "compound"
    },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

// Workout day type schema (e.g., "Push Day", "Upper Body", custom names)
const workoutDayTypeSchema = new Schema<IWorkoutDayType>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    exercises: { type: [planExerciseSchema], default: [] },
  },
  { _id: false }
);

// Weekly schedule schema
const weeklyScheduleSchema = new Schema<IWeeklySchedule>(
  {
    monday: { type: String, default: null },
    tuesday: { type: String, default: null },
    wednesday: { type: String, default: null },
    thursday: { type: String, default: null },
    friday: { type: String, default: null },
    saturday: { type: String, default: null },
    sunday: { type: String, default: null },
  },
  { _id: false }
);

// Targets schema
const targetsSchema = new Schema<IPlanTargets>(
  {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    water: { type: Number, required: true, min: 0, max: 10 },
  },
  { _id: false }
);

// Main Plan schema
const planSchema = new Schema<IPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Note: index is created below with unique constraint
    },
    diet: {
      meals: {
        type: [planMealSchema],
        default: [],
      },
    },
    workout: {
      dayTypes: {
        type: [workoutDayTypeSchema],
        default: [],
      },
      weeklySchedule: {
        type: weeklyScheduleSchema,
        default: {
          monday: null,
          tuesday: null,
          wednesday: null,
          thursday: null,
          friday: null,
          saturday: null,
          sunday: null,
        },
      },
    },
    targets: {
      type: targetsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one plan per user
planSchema.index({ userId: 1 }, { unique: true });

// Virtual to calculate total macros from meals (useful for validation)
planSchema.virtual("calculatedTotals").get(function () {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (this.diet?.meals) {
    for (const meal of this.diet.meals) {
      for (const item of meal.items) {
        totals.calories += item.calories;
        totals.protein += item.protein;
        totals.carbs += item.carbs;
        totals.fat += item.fat;
      }
    }
  }
  
  return totals;
});

// Helper method to get today's scheduled workout
planSchema.methods.getTodayWorkout = function () {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()] as keyof IWeeklySchedule;
  const dayTypeId = this.workout.weeklySchedule[today];
  
  if (!dayTypeId) {
    return null; // Rest day
  }
  
  return this.workout.dayTypes.find((dt: IWorkoutDayType) => dt.id === dayTypeId) || null;
};

// Helper method to get workout for a specific day
planSchema.methods.getWorkoutForDay = function (date: Date) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = days[date.getDay()] as keyof IWeeklySchedule;
  const dayTypeId = this.workout.weeklySchedule[dayName];
  
  if (!dayTypeId) {
    return null; // Rest day
  }
  
  return this.workout.dayTypes.find((dt: IWorkoutDayType) => dt.id === dayTypeId) || null;
};

export const Plan = mongoose.model<IPlan>("Plan", planSchema);
