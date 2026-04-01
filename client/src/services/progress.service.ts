import api from "./api";
import { ProgressEntry, LogProgressData, ProgressSummary, ApiResponse } from "@/types";

export const progressService = {
  // Log progress
  logProgress: async (data: LogProgressData): Promise<ProgressEntry> => {
    const response = await api.post<ApiResponse<ProgressEntry>>("/progress", data);
    return response.data.data as ProgressEntry;
  },

  // Get progress history
  getProgress: async (params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ProgressEntry[]> => {
    const response = await api.get<ApiResponse<ProgressEntry[]>>("/progress", { params });
    return response.data.data as ProgressEntry[];
  },

  // Get latest progress entry
  getLatestProgress: async (): Promise<ProgressEntry | null> => {
    const response = await api.get<ApiResponse<ProgressEntry>>("/progress/latest");
    return response.data.data as ProgressEntry | null;
  },

  // Get aggregated progress summary
  getProgressSummary: async (): Promise<ProgressSummary | null> => {
    const response = await api.get<ApiResponse<ProgressSummary | null>>("/progress/summary");
    return (response.data.data as ProgressSummary | null) ?? null;
  },
};
