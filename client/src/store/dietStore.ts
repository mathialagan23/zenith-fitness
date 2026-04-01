import { create } from "zustand";
import { FoodLog, DietSummary, MealStatus, ExtraFoodItem, PlanTargets } from "@/types";
import { dietService } from "@/services";

interface DietState {
  todayLog: FoodLog | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodayLog: (date?: string) => Promise<void>;
  updateMealStatus: (mealIndex: number, status: MealStatus) => Promise<void>;
  addExtraItem: (item: ExtraFoodItem) => Promise<void>;
  removeExtraItem: (itemIndex: number) => Promise<void>;
  updateWaterIntake: (amount: number) => Promise<void>;
  getConsumedTotals: () => { calories: number; protein: number; carbs: number; fat: number };
  getDailySummary: (targets: PlanTargets) => DietSummary;
  clearError: () => void;
}

export const useDietStore = create<DietState>((set, get) => ({
  todayLog: null,
  isLoading: false,
  error: null,

  fetchTodayLog: async (date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const todayLog = await dietService.getFoodLog(date);
      set({ todayLog, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch food log", isLoading: false });
    }
  },

  updateMealStatus: async (mealIndex: number, status: MealStatus) => {
    const { todayLog } = get();
    
    // Optimistic update only if we have a log
    if (todayLog) {
      const updatedMeals = todayLog.plannedMeals.map((meal, idx) =>
        idx === mealIndex ? { ...meal, status } : meal
      );
      set({
        todayLog: { ...todayLog, plannedMeals: updatedMeals },
        isLoading: true,
      });
    } else {
      set({ isLoading: true });
    }

    try {
      const updated = await dietService.updateMealStatus({ mealIndex, status });
      set({ todayLog: updated, isLoading: false, error: null });
    } catch (error: unknown) {
      // Revert on error (only if we had a log before)
      if (todayLog) {
        set({ todayLog, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      const err = error as { message?: string };
      set({ error: err.message || "Failed to update meal status" });
    }
  },

  addExtraItem: async (item: ExtraFoodItem) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await dietService.addExtraItem({ item });
      set({ todayLog: updated, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to add extra item", isLoading: false });
    }
  },

  removeExtraItem: async (itemIndex: number) => {
    const { todayLog } = get();
    if (!todayLog) return;

    // Optimistic update
    const updatedItems = todayLog.extraItems.filter((_, idx) => idx !== itemIndex);
    set({
      todayLog: { ...todayLog, extraItems: updatedItems },
      isLoading: true,
    });

    try {
      const updated = await dietService.removeExtraItem({ itemIndex });
      set({ todayLog: updated, isLoading: false });
    } catch (error: unknown) {
      // Revert on error
      set({ todayLog, isLoading: false });
      const err = error as { message?: string };
      set({ error: err.message || "Failed to remove extra item" });
    }
  },

  updateWaterIntake: async (amount: number) => {
    const { todayLog } = get();
    
    // Optimistic update
    if (todayLog) {
      set({ todayLog: { ...todayLog, waterIntake: amount } });
    }

    set({ isLoading: true });
    try {
      const updated = await dietService.updateWaterIntake({ waterIntake: amount });
      set({ todayLog: updated, isLoading: false });
    } catch (error: unknown) {
      // Revert on error
      if (todayLog) {
        set({ todayLog });
      }
      const err = error as { message?: string };
      set({ error: err.message || "Failed to update water intake", isLoading: false });
    }
  },

  // Calculate consumed totals from eaten meals + extra items
  getConsumedTotals: () => {
    const { todayLog } = get();
    if (!todayLog) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Add eaten planned meals
    for (const meal of todayLog.plannedMeals) {
      if (meal.status === "eaten") {
        for (const item of meal.items) {
          totals.calories += item.calories;
          totals.protein += item.protein;
          totals.carbs += item.carbs;
          totals.fat += item.fat;
        }
      }
    }

    // Add extra items
    for (const item of todayLog.extraItems) {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.carbs += item.carbs;
      totals.fat += item.fat;
    }

    return totals;
  },

  getDailySummary: (targets: PlanTargets) => {
    const totals = get().getConsumedTotals();

    return {
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      calorieProgress: targets.calories > 0 ? (totals.calories / targets.calories) * 100 : 0,
      proteinProgress: targets.protein > 0 ? (totals.protein / targets.protein) * 100 : 0,
      isOnTrack: totals.calories <= targets.calories,
    };
  },

  clearError: () => set({ error: null }),
}));
