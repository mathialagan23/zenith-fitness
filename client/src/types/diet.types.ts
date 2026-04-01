// Food item type
export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Extra food item (not in plan)
export interface ExtraFoodItem extends FoodItem {
  mealContext?: string; // e.g., "with lunch", "snack", "post-workout"
}

// Planned meal log status
export type MealStatus = "eaten" | "skipped" | "pending";

// Planned meal log (meal from plan with status)
export interface PlannedMealLog {
  mealName: string;
  status: MealStatus;
  items: FoodItem[];
}

// Food log for a specific day (new plan-driven structure)
export interface FoodLog {
  _id: string;
  userId: string;
  date: string;
  plannedMeals: PlannedMealLog[];
  extraItems: ExtraFoodItem[];
  waterIntake: number;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: string;
}

// Meal type for diet plan (legacy - keeping for backward compatibility)
export interface Meal {
  name: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  items: FoodItem[];
}

// Diet plan (legacy - now use Plan instead)
export interface DietPlan {
  _id: string;
  userId: string;
  meals: Meal[];
  createdAt: string;
  updatedAt: string;
}

// Legacy food log meal (deprecated)
export interface FoodLogMeal {
  name: string;
  followed: boolean;
  items: FoodItem[];
}

// Daily diet summary
export interface DietSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieProgress: number;
  proteinProgress: number;
  isOnTrack: boolean;
}
