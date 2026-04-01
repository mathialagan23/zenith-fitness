import { Request } from "express";
import { Types } from "mongoose";

// User types
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  weight: number;
  height: number;
  goal: "cutting" | "bulking" | "maintenance" | "recomposition";
  hasCompletedSetup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============================================
// PLAN TYPES (Unified Diet + Workout + Targets)
// ============================================

// Exercise type for categorization
export type ExerciseType = "compound" | "isolation" | "bodyweight";

// Plan exercise - DECOUPLED from weight (weight belongs in logs only)
export interface IPlanExercise {
  name: string;
  targetSets: number;
  targetReps: string;  // Now supports rep ranges like "6-8", "10-12", "8", "max"
  exerciseType?: ExerciseType;  // Optional categorization
  notes?: string;  // Optional notes like "slow eccentric", "pause at bottom"
}

export interface IWorkoutDayType {
  id: string;
  name: string;
  exercises: IPlanExercise[];
}

export interface IWeeklySchedule {
  monday: string | null;    // dayType id or null for rest
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
}

export interface IPlanMeal {
  name: string;  // Custom meal names allowed (Breakfast, Lunch, Dinner, Snacks, or custom)
  time?: string; // Optional time like "8:00 AM"
  items: IFoodItem[];
}

export interface IPlanTargets {
  calories: number;   // Auto-calculated from meals
  protein: number;    // Auto-calculated from meals
  carbs: number;      // Auto-calculated from meals
  fat: number;        // Auto-calculated from meals
  water: number;      // User-specified (in liters)
}

export interface IPlan {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  diet: {
    meals: IPlanMeal[];
  };
  workout: {
    dayTypes: IWorkoutDayType[];
    weeklySchedule: IWeeklySchedule;
  };
  targets: IPlanTargets;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Diet types
export interface IFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IMeal {
  name: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  items: IFoodItem[];
}

export interface IDietPlan {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  meals: IMeal[];
  createdAt: Date;
  updatedAt: Date;
}

// Legacy FoodLogMeal (kept for backward compatibility)
export interface IFoodLogMeal {
  name: string;
  followed: boolean;
  items: IFoodItem[];
}

// New Plan-driven FoodLog types
export interface IPlannedMealLog {
  mealName: string;
  status: "eaten" | "skipped" | "pending";
  items: IFoodItem[];  // Copied from plan at time of logging
}

export interface IExtraFoodItem extends IFoodItem {
  mealContext?: string;  // Optional: "with lunch", "snack", etc.
}

export interface IFoodLog {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  plannedMeals: IPlannedMealLog[];  // Meals from the plan with status
  extraItems: IExtraFoodItem[];     // Additional items not in plan
  waterIntake: number;
  createdAt: Date;
}

// Workout types
export interface ISet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface IExercise {
  name: string;
  sets: ISet[];
  completed: boolean;
}

export interface IWorkoutDay {
  name: string;
  exercises: IExercise[];
}

export interface IWorkoutPlan {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  split: {
    Push: IWorkoutDay;
    Pull: IWorkoutDay;
    Legs: IWorkoutDay;
    Rest: IWorkoutDay;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Workout log set - actual performance data
export interface IWorkoutLogSet {
  weight: number;
  reps: number;
  completed: boolean;
}

// Workout log exercise - what the user actually performed
export interface IWorkoutLogExercise {
  name: string;
  sets: IWorkoutLogSet[];
  completed: boolean;
  // Reference to plan for showing targets
  targetSets?: number;
  targetReps?: string;
  exerciseType?: ExerciseType;
  // Previous session data for progressive overload hints
  previousBest?: {
    weight: number;
    reps: number;
    date: string;
  };
}

export interface IWorkoutLog {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  dayType: string;  // Now dynamic - references IWorkoutDayType.id from Plan
  dayTypeName: string;  // Human-readable name (e.g., "Push Day", "Upper Body")
  exercises: IWorkoutLogExercise[];
  caloriesBurned: number;
  duration: number;
  notes?: string;
  createdAt: Date;
}

// Progress types
export interface IMeasurements {
  chest?: number;
  waist?: number;
  arms?: number;
  thighs?: number;
}

export interface IProgress {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  weight: number;
  bodyFat?: number;
  measurements?: IMeasurements;
  notes?: string;
  createdAt: Date;
}

// Insights types
export interface IInsights {
	// Core aggregated metrics
	proteinConsistency: number;
	workoutAdherence: number;
	weightTrend: "up" | "down" | "stable";
	weightChange: number;
	avgCaloriesConsumed: number;
	avgCaloriesBurned: number;
	totalWorkouts: number;
	currentStreak: number;
	highlights: string[];

	// Extended metrics used by the client UI
	proteinGoalDays: number; // Number of days protein target was hit
	workoutsCompleted: number; // Alias for totalWorkouts
	avgCalories: number; // Alias for avgCaloriesConsumed
	avgProtein: number; // Average daily protein
	caloriesBurned: number; // Total calories burned in workouts
	totalVolume: number; // Total lifted volume (kg * reps)
	recommendations: string[]; // Text recommendations based on habits
}

// Request types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
