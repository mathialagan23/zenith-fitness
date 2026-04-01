import { Response } from "express";
import { z } from "zod";
import { User } from "../models/index.js";
import { AuthRequest } from "../types/index.js";
import { logger } from "../utils/logger.js";

// Validation schema (targets are now in Plan, not User)
export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    weight: z.number().min(30).max(300).optional(),
    height: z.number().min(100).max(250).optional(),
    goal: z.enum(["cutting", "bulking", "maintenance", "recomposition"]).optional(),
  }),
});

export const getUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        weight: user.weight,
        height: user.height,
        goal: user.goal,
        hasCompletedSetup: user.hasCompletedSetup,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error("GetUser error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.email;
    delete updates.password;
    delete updates.hasCompletedSetup; // Only changed via Plan creation

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        weight: user.weight,
        height: user.height,
        goal: user.goal,
        hasCompletedSetup: user.hasCompletedSetup,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error("UpdateUser error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
};
