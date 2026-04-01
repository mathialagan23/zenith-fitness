import { get, post, put, del } from "./api";
import { Plan, TodayPlan, CreatePlanData, UpdatePlanData } from "@/types";

export const planService = {
  // Get user's plan
  getPlan: async (): Promise<Plan | null> => {
    return get<Plan | null>("/plan");
  },

  // Create or replace plan
  createPlan: async (data: CreatePlanData): Promise<Plan> => {
    return post<Plan>("/plan", data);
  },

  // Update plan (partial)
  updatePlan: async (data: UpdatePlanData): Promise<Plan> => {
    return put<Plan>("/plan", data);
  },

  // Delete plan
  deletePlan: async (): Promise<void> => {
    return del<void>("/plan");
  },

  // Get today's plan (meals + scheduled workout + targets)
  getTodayPlan: async (): Promise<TodayPlan> => {
    return get<TodayPlan>("/plan/today");
  },

  // Get plan for specific date
  getPlanForDate: async (date: string): Promise<TodayPlan> => {
    return get<TodayPlan>(`/plan/date/${date}`);
  },
};
