import api from "./api";
import { Insights, ApiResponse } from "@/types";

export const insightsService = {
  // Get insights
  getInsights: async (days?: number): Promise<Insights> => {
    const params = days ? { days } : {};
    const response = await api.get<ApiResponse<Insights>>("/insights", { params });
    return response.data.data as Insights;
  },
};
