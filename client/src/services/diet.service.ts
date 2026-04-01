import api from "./api";
import {
  DietPlan,
  FoodLog,
  PlannedMealLog,
  ExtraFoodItem,
  MealStatus,
  ApiResponse,
} from "@/types";

export const dietService = {
  // Get food log for a specific date
  getFoodLog: async (date?: string): Promise<FoodLog> => {
    const params = date ? { date } : {};
    const response = await api.get<ApiResponse<FoodLog>>("/diet/log", { params });
    return response.data.data as FoodLog;
  },

  // Update food log (general update)
  updateFoodLog: async (data: {
    date?: string;
    plannedMeals?: PlannedMealLog[];
    extraItems?: ExtraFoodItem[];
    waterIntake?: number;
  }): Promise<FoodLog> => {
    const response = await api.post<ApiResponse<FoodLog>>("/diet/log", data);
    return response.data.data as FoodLog;
  },

  // Update a specific meal's status
  updateMealStatus: async (data: {
    date?: string;
    mealIndex: number;
    status: MealStatus;
  }): Promise<FoodLog> => {
    const response = await api.patch<ApiResponse<FoodLog>>("/diet/log/meal-status", data);
    return response.data.data as FoodLog;
  },

  // Add an extra food item (not in plan)
  addExtraItem: async (data: {
    date?: string;
    item: ExtraFoodItem;
  }): Promise<FoodLog> => {
    const response = await api.post<ApiResponse<FoodLog>>("/diet/log/extra-item", data);
    return response.data.data as FoodLog;
  },

  // Remove an extra food item
  removeExtraItem: async (data: {
    date?: string;
    itemIndex: number;
  }): Promise<FoodLog> => {
    const response = await api.delete<ApiResponse<FoodLog>>("/diet/log/extra-item", { data });
    return response.data.data as FoodLog;
  },

  // Update water intake
  updateWaterIntake: async (data: {
    date?: string;
    waterIntake: number;
  }): Promise<FoodLog> => {
    const response = await api.patch<ApiResponse<FoodLog>>("/diet/log/water", data);
    return response.data.data as FoodLog;
  },

  // Get food logs for date range
  getFoodLogs: async (startDate?: string, endDate?: string): Promise<FoodLog[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get<ApiResponse<FoodLog[]>>("/diet/logs", { params });
    return response.data.data as FoodLog[];
  },

  // ============================================
  // LEGACY ENDPOINTS (for backward compatibility)
  // ============================================

  // Get diet plan (legacy - now returns Plan's diet section)
  getDietPlan: async (): Promise<DietPlan> => {
    const response = await api.get<ApiResponse<DietPlan>>("/diet/plan");
    return response.data.data as DietPlan;
  },

  // Update diet plan (legacy - now updates Plan's diet section)
  updateDietPlan: async (meals: DietPlan["meals"]): Promise<DietPlan> => {
    const response = await api.put<ApiResponse<DietPlan>>("/diet/plan", { meals });
    return response.data.data as DietPlan;
  },
};
