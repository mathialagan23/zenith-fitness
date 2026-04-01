import api from "./api";
import { WorkoutLog, WorkoutLogExercise, TodayWorkout, PreviousBest, ApiResponse } from "@/types";

export const workoutService = {
  // Get today's scheduled workout from Plan
  getTodayWorkout: async (date?: string): Promise<TodayWorkout> => {
    const params = date ? { date } : {};
    const response = await api.get<ApiResponse<TodayWorkout>>("/workout/today", { params });
    return response.data.data as TodayWorkout;
  },

  // Log workout for a day
  logWorkout: async (data: {
    date?: string;
    dayType: string;
    dayTypeName: string;
    exercises: WorkoutLogExercise[];
    notes?: string;
  }): Promise<WorkoutLog> => {
    const response = await api.post<ApiResponse<WorkoutLog>>("/workout/log", data);
    return response.data.data as WorkoutLog;
  },

  // Get workout log for a specific date
  getWorkoutLog: async (date?: string): Promise<WorkoutLog | null> => {
    const params = date ? { date } : {};
    const response = await api.get<ApiResponse<WorkoutLog>>("/workout/log", { params });
    return response.data.data as WorkoutLog | null;
  },

  // Get workout logs for date range
  getWorkoutLogs: async (startDate?: string, endDate?: string): Promise<WorkoutLog[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get<ApiResponse<WorkoutLog[]>>("/workout/logs", { params });
    return response.data.data as WorkoutLog[];
  },

  // Get previous best for a specific exercise
  getPreviousBest: async (exerciseName: string): Promise<PreviousBest | null> => {
    const params = { exerciseName };
    const response = await api.get<ApiResponse<PreviousBest | null>>("/workout/previous-best", {
      params,
    });
    return response.data.data;
  },

  // Get previous bests for multiple exercises (batch)
  getPreviousBests: async (exerciseNames: string[]): Promise<Record<string, PreviousBest>> => {
    const response = await api.post<ApiResponse<Record<string, PreviousBest>>>(
      "/workout/previous-bests",
      { exerciseNames }
    );
    return response.data.data as Record<string, PreviousBest>;
  },

  // Mark workout as complete (for rest days or quick completion)
  markWorkoutComplete: async (data: {
    date?: string;
    dayType: string;
    dayTypeName: string;
  }): Promise<WorkoutLog> => {
    const response = await api.post<ApiResponse<WorkoutLog>>("/workout/complete", data);
    return response.data.data as WorkoutLog;
  },
};
