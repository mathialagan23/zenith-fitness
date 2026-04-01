import { create } from "zustand";
import { WorkoutLog, WorkoutLogExercise, TodayWorkout, PreviousBest } from "@/types";
import { workoutService } from "@/services";

interface WorkoutState {
  todayWorkout: TodayWorkout | null;
  todayLog: WorkoutLog | null;
  workoutHistory: WorkoutLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodayWorkout: (date?: string) => Promise<void>;
  fetchTodayLog: (date?: string) => Promise<void>;
  fetchWorkoutHistory: (startDate?: string, endDate?: string) => Promise<void>;
  logWorkout: (
    dayType: string,
    dayTypeName: string,
    exercises: WorkoutLogExercise[],
    notes?: string,
    date?: string
  ) => Promise<void>;
  markWorkoutComplete: (dayType: string, dayTypeName: string, date?: string) => Promise<void>;
  getCompletionStats: () => { completed: number; total: number; caloriesBurned: number };
  getPreviousBest: (exerciseName: string) => PreviousBest | undefined;
  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  todayWorkout: null,
  todayLog: null,
  workoutHistory: [],
  isLoading: false,
  error: null,

  fetchTodayWorkout: async (date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const todayWorkout = await workoutService.getTodayWorkout(date);
      set({ todayWorkout, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch today's workout", isLoading: false });
    }
  },

  fetchTodayLog: async (date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const todayLog = await workoutService.getWorkoutLog(date);
      set({ todayLog, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch workout log", isLoading: false });
    }
  },

  fetchWorkoutHistory: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const workoutHistory = await workoutService.getWorkoutLogs(startDate, endDate);
      set({ workoutHistory, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch workout history", isLoading: false });
    }
  },

  logWorkout: async (dayType, dayTypeName, exercises, notes, date) => {
    set({ isLoading: true, error: null });
    try {
      const todayLog = await workoutService.logWorkout({
        dayType,
        dayTypeName,
        exercises,
        notes,
        date,
      });
      set({ todayLog, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to log workout", isLoading: false });
    }
  },

  markWorkoutComplete: async (dayType, dayTypeName, date) => {
    set({ isLoading: true, error: null });
    try {
      const todayLog = await workoutService.markWorkoutComplete({
        dayType,
        dayTypeName,
        date,
      });
      set({ todayLog, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to mark workout complete", isLoading: false });
    }
  },

  getCompletionStats: () => {
    const { todayLog, todayWorkout } = get();

    // If it's a rest day
    if (todayWorkout?.isRestDay) {
      return { completed: 0, total: 0, caloriesBurned: 0 };
    }

    // If we have a log, calculate from it
    if (todayLog) {
      const completed = todayLog.exercises.filter((e) => e.completed).length;
      const total = todayLog.exercises.length;
      return {
        completed,
        total,
        caloriesBurned: todayLog.caloriesBurned,
      };
    }

    // If we only have the scheduled workout (no log yet)
    if (todayWorkout?.workout) {
      return {
        completed: 0,
        total: todayWorkout.workout.exercises.length,
        caloriesBurned: 0,
      };
    }

    return { completed: 0, total: 0, caloriesBurned: 0 };
  },

  /**
   * Get the previous best performance for an exercise
   * Searches through workout history to find the best weight×reps combination
   */
  getPreviousBest: (exerciseName: string): PreviousBest | undefined => {
    const { workoutHistory } = get();

    let best: PreviousBest | undefined;
    let bestVolume = 0; // weight × reps

    for (const log of workoutHistory) {
      for (const exercise of log.exercises) {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          for (const set of exercise.sets) {
            if (set.completed) {
              const volume = set.weight * set.reps;
              if (volume > bestVolume) {
                bestVolume = volume;
                best = {
                  weight: set.weight,
                  reps: set.reps,
                  date: log.date,
                };
              }
            }
          }
        }
      }
    }

    return best;
  },

  clearError: () => set({ error: null }),
}));
