import mongoose, { Schema, Model } from "mongoose";
import { IUser, IUserMethods } from "../types/index.js";
import { hashPassword, comparePassword } from "../utils/hash.js";

type UserModel = Model<IUser, object, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password by default
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    weight: {
      type: Number,
      default: 70,
      min: [30, "Weight must be at least 30kg"],
      max: [300, "Weight cannot exceed 300kg"],
    },
    height: {
      type: Number,
      default: 170,
      min: [100, "Height must be at least 100cm"],
      max: [250, "Height cannot exceed 250cm"],
    },
    goal: {
      type: String,
      enum: ["cutting", "bulking", "maintenance", "recomposition"],
      default: "maintenance",
    },
    hasCompletedSetup: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await hashPassword(this.password);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

// Note: email index is already created via `unique: true` on the field

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
