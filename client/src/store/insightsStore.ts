import { create } from "zustand";
import { Insights } from "@/types";
import { insightsService } from "@/services";

interface InsightsState {
  insights: Insights | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchInsights: (days?: number) => Promise<void>;
  clearError: () => void;
}

export const useInsightsStore = create<InsightsState>((set) => ({
  insights: null,
  isLoading: false,
  error: null,

  fetchInsights: async (days = 7) => {
    set({ isLoading: true, error: null });
    try {
      const insights = await insightsService.getInsights(days);
      set({ insights, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch insights", isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
