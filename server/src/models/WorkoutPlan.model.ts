import mongoose, { Schema } from "mongoose";
import { IWorkoutPlan, IWorkoutDay, IExercise, ISet } from "../types/index.js";

const setSchema = new Schema<ISet>(
  {
    weight: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: [setSchema], default: [] },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const workoutDaySchema = new Schema<IWorkoutDay>(
  {
    name: { type: String, required: true },
    exercises: { type: [exerciseSchema], default: [] },
  },
  { _id: false }
);

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Note: index is created below with unique constraint
    },
    split: {
      Push: { type: workoutDaySchema, default: { name: "Push Day", exercises: [] } },
      Pull: { type: workoutDaySchema, default: { name: "Pull Day", exercises: [] } },
      Legs: { type: workoutDaySchema, default: { name: "Leg Day", exercises: [] } },
      Rest: { type: workoutDaySchema, default: { name: "Rest Day", exercises: [] } },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one workout plan per user
workoutPlanSchema.index({ userId: 1 }, { unique: true });

export const WorkoutPlan = mongoose.model<IWorkoutPlan>(
  "WorkoutPlan",
  workoutPlanSchema
);
