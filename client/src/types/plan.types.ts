// Import FoodItem from diet.types to avoid duplication
import type { FoodItem } from "./diet.types";

// Re-export for convenience
export type { FoodItem };

// Plan meal with optional time
export interface PlanMeal {
  name: string;
  time?: string;
  items: FoodItem[];
}

// Exercise type for categorization
export type ExerciseType = "compound" | "isolation" | "bodyweight";

// Exercise in a workout plan - DECOUPLED from weight
// Weight belongs ONLY in workout logs (actual performance)
export interface PlanExercise {
  name: string;
  targetSets: number;
  targetReps: string;  // Rep ranges like "6-8", "10-12", "8", "max"
  exerciseType?: ExerciseType;
  notes?: string;
}

// Workout day type (e.g., "Push Day", "Upper Body", custom names)
export interface WorkoutDayType {
  id: string;
  name: string;
  exercises: PlanExercise[];
}

// Weekly schedule - maps each day to a workout day type ID or null (rest)
export interface WeeklySchedule {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
}

// Auto-calculated + user-specified targets
export interface PlanTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

// Main Plan interface
export interface Plan {
  _id: string;
  userId: string;
  diet: {
    meals: PlanMeal[];
  };
  workout: {
    dayTypes: WorkoutDayType[];
    weeklySchedule: WeeklySchedule;
  };
  targets: PlanTargets;
  createdAt: string;
  updatedAt: string;
}

// Today's plan response
export interface TodayPlan {
  date: string;
  dayOfWeek: keyof WeeklySchedule;
  meals: PlanMeal[];
  workout: WorkoutDayType | null;
  isRestDay: boolean;
  targets: PlanTargets;
}

// Plan creation/update data
export interface CreatePlanData {
  diet: {
    meals: PlanMeal[];
  };
  workout: {
    dayTypes: WorkoutDayType[];
    weeklySchedule: WeeklySchedule;
  };
  targets?: Partial<PlanTargets>;
}

export interface UpdatePlanData {
  diet?: {
    meals: PlanMeal[];
  };
  workout?: {
    dayTypes: WorkoutDayType[];
    weeklySchedule: WeeklySchedule;
  };
  targets?: Partial<PlanTargets>;
}

// Wizard step data
export interface WizardProfileData {
  weight: number;
  height: number;
  goal: "cutting" | "bulking" | "maintenance" | "recomposition";
}

export interface WizardDietData {
  meals: PlanMeal[];
}

export interface WizardWorkoutData {
  dayTypes: WorkoutDayType[];
}

export interface WizardScheduleData {
  weeklySchedule: WeeklySchedule;
}

export interface WizardTargetsData {
  water: number;
  // Macros are auto-calculated but can be overridden
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Complete wizard state
export interface PlanWizardState {
  currentStep: number;
  profile: WizardProfileData;
  diet: WizardDietData;
  workout: WizardWorkoutData;
  schedule: WizardScheduleData;
  targets: WizardTargetsData;
}

// Day names for iteration
export const DAYS_OF_WEEK: (keyof WeeklySchedule)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<keyof WeeklySchedule, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};
