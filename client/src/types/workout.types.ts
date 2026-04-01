import { ExerciseType } from "./plan.types";

// ============================================
// WORKOUT LOG TYPES (Actual Performance Data)
// ============================================

// Individual set in a workout log
export interface WorkoutSet {
  weight: number;
  reps: number;
  completed: boolean;
}

// Previous best for progressive overload hints
export interface PreviousBest {
  weight: number;
  reps: number;
  date: string;
}

// Workout log exercise - what the user actually performed
export interface WorkoutLogExercise {
  name: string;
  sets: WorkoutSet[];
  completed: boolean;
  // Reference to plan for showing targets
  targetSets?: number;
  targetReps?: string;
  exerciseType?: ExerciseType;
  // Previous session data for progressive overload hints
  previousBest?: PreviousBest;
}

// Workout log for a specific day (plan-driven)
export interface WorkoutLog {
  _id: string;
  userId: string;
  date: string;
  dayType: string; // Dynamic - references WorkoutDayType.id from Plan
  dayTypeName: string; // Human-readable name (e.g., "Push Day", "Upper Body")
  exercises: WorkoutLogExercise[];
  caloriesBurned: number;
  duration: number;
  notes?: string;
  createdAt: string;
}

// Today's workout response from /workout/today
export interface TodayWorkout {
  isRestDay: boolean;
  workout: {
    id: string;
    name: string;
    exercises: {
      name: string;
      targetSets: number;
      targetReps: string;  // Now string for rep ranges
      exerciseType?: ExerciseType;
      notes?: string;
      // Previous best from workout history (populated by backend)
      previousBest?: PreviousBest;
    }[];
  } | null;
  dayOfWeek: string;
  message?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse rep range string to get min/max values
 * Examples: "6-8" -> { min: 6, max: 8 }, "10" -> { min: 10, max: 10 }, "max" -> { min: 0, max: 999 }
 */
export const parseRepRange = (repRange: string): { min: number; max: number } => {
  if (repRange.toLowerCase() === "max" || repRange.toLowerCase() === "amrap") {
    return { min: 0, max: 999 };
  }
  
  const rangeMatch = repRange.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }
  
  const singleMatch = repRange.match(/^(\d+)$/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1]);
    return { min: val, max: val };
  }
  
  return { min: 8, max: 12 }; // Default fallback
};

/**
 * Format rep range for display
 * Examples: "6-8" -> "6–8 reps", "10" -> "10 reps", "max" -> "Max reps"
 */
export const formatRepRange = (repRange: string): string => {
  if (repRange.toLowerCase() === "max" || repRange.toLowerCase() === "amrap") {
    return "Max reps";
  }
  
  const rangeMatch = repRange.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    return `${rangeMatch[1]}–${rangeMatch[2]} reps`;
  }
  
  return `${repRange} reps`;
};

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

// Exercise type (legacy)
export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  completed: boolean;
}

// Workout day type (legacy)
export interface WorkoutDay {
  name: string;
  exercises: Exercise[];
}

// Workout split (legacy - hardcoded Push/Pull/Legs/Rest)
export type WorkoutSplit = {
  Push: WorkoutDay;
  Pull: WorkoutDay;
  Legs: WorkoutDay;
  Rest: WorkoutDay;
};

export type DayType = keyof WorkoutSplit;

// Workout plan (legacy)
export interface WorkoutPlan {
  _id: string;
  userId: string;
  split: WorkoutSplit;
  createdAt: string;
  updatedAt: string;
}
