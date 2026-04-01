import mongoose, { Schema } from "mongoose";
import { IProgress, IMeasurements } from "../types/index.js";

const measurementsSchema = new Schema<IMeasurements>(
  {
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    arms: { type: Number, min: 0 },
    thighs: { type: Number, min: 0 },
  },
  { _id: false }
);

const progressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Note: index is created below with compound index
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    weight: {
      type: Number,
      required: true,
      min: [30, "Weight must be at least 30kg"],
      max: [300, "Weight cannot exceed 300kg"],
    },
    bodyFat: {
      type: Number,
      min: [1, "Body fat must be at least 1%"],
      max: [60, "Body fat cannot exceed 60%"],
    },
    measurements: {
      type: measurementsSchema,
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
progressSchema.index({ userId: 1, date: -1 });

export const Progress = mongoose.model<IProgress>("Progress", progressSchema);
