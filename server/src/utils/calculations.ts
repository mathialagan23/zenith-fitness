import { IWorkoutLogExercise } from "../types/index.js";

// MET values for common exercises (Metabolic Equivalent of Task)
const MET_VALUES: Record<string, number> = {
  // Push exercises
  "Bench Press": 5.0,
  "Overhead Press": 5.0,
  "Incline Dumbbell Press": 5.0,
  "Lateral Raises": 3.5,
  "Tricep Pushdowns": 3.5,
  "Dips": 5.0,
  "Push-ups": 4.0,
  "Cable Flyes": 3.5,
  
  // Pull exercises
  "Deadlift": 6.0,
  "Barbell Row": 5.5,
  "Pull-ups": 5.5,
  "Chin-ups": 5.5,
  "Bicep Curls": 3.5,
  "Lat Pulldown": 4.5,
  "Face Pulls": 3.0,
  "Hammer Curls": 3.5,
  
  // Leg exercises
  "Squats": 6.0,
  "Leg Press": 5.5,
  "Romanian Deadlift": 5.5,
  "Leg Curls": 4.0,
  "Leg Extensions": 4.0,
  "Calf Raises": 3.0,
  "Lunges": 5.0,
  "Hip Thrusts": 4.5,
  
  // Default
  "default": 4.0,
};

/**
 * Estimate calories burned during a workout
 * Formula: Calories = MET × weight (kg) × time (hours)
 * Average time per set: 1.5 minutes (including rest)
 */
export const estimateCaloriesBurned = (
  exercises: IWorkoutLogExercise[],
  userWeight: number
): number => {
  let totalCalories = 0;
  
  for (const exercise of exercises) {
    if (!exercise.completed) continue;
    
    const met = MET_VALUES[exercise.name] || MET_VALUES["default"];
    const completedSets = exercise.sets.filter((s) => s.completed).length;
    const timeInHours = (completedSets * 1.5) / 60; // 1.5 min per set
    
    totalCalories += met * userWeight * timeInHours;
  }
  
  return Math.round(totalCalories);
};

/**
 * Estimate workout duration based on completed sets
 * Average: 1.5 minutes per set (including rest)
 */
export const estimateWorkoutDuration = (
  exercises: IWorkoutLogExercise[]
): number => {
  let totalSets = 0;
  
  for (const exercise of exercises) {
    if (!exercise.completed) continue;
    totalSets += exercise.sets.filter((s) => s.completed).length;
  }
  
  return Math.round(totalSets * 1.5);
};

/**
 * Calculate protein goal achievement percentage for a period
 */
export const calculateProteinConsistency = (
  dailyProtein: number[],
  targetMin: number
): number => {
  if (dailyProtein.length === 0) return 0;
  
  const daysOnTarget = dailyProtein.filter((p) => p >= targetMin).length;
  return Math.round((daysOnTarget / dailyProtein.length) * 100);
};

/**
 * Calculate workout adherence percentage
 */
export const calculateWorkoutAdherence = (
  workoutsCompleted: number,
  workoutsPlanned: number
): number => {
  if (workoutsPlanned === 0) return 0;
  return Math.round((workoutsCompleted / workoutsPlanned) * 100);
};

/**
 * Determine weight trend from progress data
 */
export const calculateWeightTrend = (
  weights: number[]
): { trend: "up" | "down" | "stable"; change: number } => {
  if (weights.length < 2) {
    return { trend: "stable", change: 0 };
  }
  
  const firstWeight = weights[0];
  const lastWeight = weights[weights.length - 1];
  const change = Number((lastWeight - firstWeight).toFixed(1));
  
  if (Math.abs(change) < 0.3) {
    return { trend: "stable", change };
  }
  
  return {
    trend: change > 0 ? "up" : "down",
    change,
  };
};

/**
 * Calculate current workout streak
 */
export const calculateStreak = (workoutDates: Date[]): number => {
  if (workoutDates.length === 0) return 0;
  
  const sortedDates = [...workoutDates].sort(
    (a, b) => b.getTime() - a.getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const workoutDate = new Date(sortedDates[i]);
    workoutDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (workoutDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && workoutDate.getTime() === today.getTime() - 86400000) {
      // Allow if last workout was yesterday
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
