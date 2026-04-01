import mongoose, { Schema } from "mongoose";
import { IWorkoutLog, IWorkoutLogExercise, IWorkoutLogSet, ExerciseType } from "../types/index.js";

// Individual set schema with actual performance data
const workoutLogSetSchema = new Schema<IWorkoutLogSet>(
  {
    weight: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

// Exercise log schema with plan reference and previous best
const workoutLogExerciseSchema = new Schema<IWorkoutLogExercise>(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: [workoutLogSetSchema], default: [] },
    completed: { type: Boolean, default: false },
    // Reference to plan targets for display
    targetSets: { type: Number },
    targetReps: { type: String },
    exerciseType: { 
      type: String, 
      enum: ["compound", "isolation", "bodyweight"] as ExerciseType[]
    },
    // Previous session data for progressive overload hints
    previousBest: {
      weight: { type: Number },
      reps: { type: Number },
      date: { type: String },
    },
  },
  { _id: false }
);

const workoutLogSchema = new Schema<IWorkoutLog>(
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
    // Dynamic day type - references WorkoutDayType.id from Plan
    dayType: {
      type: String,
      required: true,
    },
    // Human-readable name (e.g., "Push Day", "Upper Body", "Chest & Triceps")
    dayTypeName: {
      type: String,
      required: true,
    },
    exercises: {
      type: [workoutLogExerciseSchema],
      default: [],
    },
    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
workoutLogSchema.index({ userId: 1, date: -1 });

// Ensure one workout log per user per day
workoutLogSchema.index(
  { userId: 1, date: 1 },
  { unique: true }
);

// Index for fetching previous workouts by exercise name
workoutLogSchema.index({ userId: 1, "exercises.name": 1, date: -1 });

export const WorkoutLog = mongoose.model<IWorkoutLog>(
  "WorkoutLog",
  workoutLogSchema
);
