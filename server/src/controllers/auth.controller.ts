import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/index.js";
import { generateToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { AuthRequest } from "../types/index.js";
import { logger } from "../utils/logger.js";

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(1, "Name is required").max(50, "Name too long"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

// Cookie options
// For cross-origin requests (frontend and backend on different domains),
// we need sameSite: "none" with secure: true for cookies to work.
const cookieOptions: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
} = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    // Create user (no default diet/workout plans - user will create via Plan Setup)
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate token
    const token = generateToken({ id: user._id.toString(), email: user.email });

    // Set cookie
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          weight: user.weight,
          height: user.height,
          goal: user.goal,
          hasCompletedSetup: user.hasCompletedSetup,
        },
      },
    });
  } catch (error) {
		logger.error("Register error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to register user",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    // Generate token
    const token = generateToken({ id: user._id.toString(), email: user.email });

    // Set cookie
    res.cookie("token", token, cookieOptions);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          weight: user.weight,
          height: user.height,
          goal: user.goal,
          hasCompletedSetup: user.hasCompletedSetup,
        },
      },
    });
  } catch (error) {
		logger.error("Login error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.cookie("token", "", {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "strict",
    secure: env.NODE_ENV === "production",
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
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
      },
    });
  } catch (error) {
		logger.error("GetMe error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
};
