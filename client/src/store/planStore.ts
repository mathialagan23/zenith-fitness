import { create } from "zustand";
import {
  Plan,
  TodayPlan,
  CreatePlanData,
  PlanMeal,
  WorkoutDayType,
  WeeklySchedule,
  PlanTargets,
  FoodItem,
  PlanExercise,
} from "@/types";
import { planService } from "@/services";

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to calculate macros from meals
export const calculateMacrosFromMeals = (meals: PlanMeal[]): Omit<PlanTargets, "water"> => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const meal of meals) {
    for (const item of meal.items) {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.carbs += item.carbs;
      totals.fat += item.fat;
    }
  }

  return totals;
};

// Default empty state
const defaultWeeklySchedule: WeeklySchedule = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

const defaultMeals: PlanMeal[] = [
  { name: "Breakfast", items: [] },
  { name: "Lunch", items: [] },
  { name: "Dinner", items: [] },
  { name: "Snacks", items: [] },
];

interface PlanState {
  // Plan data
  plan: Plan | null;
  todayPlan: TodayPlan | null;
  isLoading: boolean;
  error: string | null;

  // Wizard state
  wizardStep: number;
  wizardProfile: {
    weight: number;
    height: number;
    goal: "cutting" | "bulking" | "maintenance" | "recomposition";
  };
  wizardMeals: PlanMeal[];
  wizardDayTypes: WorkoutDayType[];
  wizardSchedule: WeeklySchedule;
  wizardWaterTarget: number;

  // Actions - Fetching
  fetchPlan: () => Promise<void>;
  fetchTodayPlan: () => Promise<void>;
  fetchPlanForDate: (date: string) => Promise<TodayPlan | null>;

  // Actions - CRUD
  createPlan: (data: CreatePlanData) => Promise<Plan>;
  updatePlan: (data: Partial<CreatePlanData>) => Promise<void>;
  deletePlan: () => Promise<void>;

  // Actions - Wizard Navigation
  setWizardStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Actions - Wizard Profile
  setWizardProfile: (profile: Partial<PlanState["wizardProfile"]>) => void;

  // Actions - Wizard Diet
  setWizardMeals: (meals: PlanMeal[]) => void;
  addMeal: (name: string) => void;
  removeMeal: (index: number) => void;
  updateMealName: (index: number, name: string) => void;
  addFoodItem: (mealIndex: number, item: FoodItem) => void;
  removeFoodItem: (mealIndex: number, itemIndex: number) => void;
  updateFoodItem: (mealIndex: number, itemIndex: number, item: FoodItem) => void;

  // Actions - Wizard Workout
  setWizardDayTypes: (dayTypes: WorkoutDayType[]) => void;
  addDayType: (name: string) => void;
  removeDayType: (id: string) => void;
  updateDayTypeName: (id: string, name: string) => void;
  addExercise: (dayTypeId: string, exercise: PlanExercise) => void;
  removeExercise: (dayTypeId: string, exerciseIndex: number) => void;
  updateExercise: (dayTypeId: string, exerciseIndex: number, exercise: PlanExercise) => void;

  // Actions - Wizard Schedule
  setWizardSchedule: (schedule: WeeklySchedule) => void;
  setDayWorkout: (day: keyof WeeklySchedule, dayTypeId: string | null) => void;

  // Actions - Wizard Targets
  setWizardWaterTarget: (water: number) => void;

  // Actions - Wizard Helpers
  getCalculatedTargets: () => PlanTargets;
  resetWizard: () => void;
  initializeWizardFromPlan: (plan: Plan) => void;
  submitWizard: () => Promise<Plan>;

  // Actions - Utility
  clearError: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  // Initial state
  plan: null,
  todayPlan: null,
  isLoading: false,
  error: null,

  // Wizard initial state
  wizardStep: 0,
  wizardProfile: {
    weight: 70,
    height: 170,
    goal: "maintenance",
  },
  wizardMeals: [...defaultMeals],
  wizardDayTypes: [],
  wizardSchedule: { ...defaultWeeklySchedule },
  wizardWaterTarget: 3,

  // Fetching actions
  fetchPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const plan = await planService.getPlan();
      set({ plan, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch plan", isLoading: false });
    }
  },

  fetchTodayPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayPlan = await planService.getTodayPlan();
      set({ todayPlan, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch today's plan", isLoading: false });
    }
  },

  fetchPlanForDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const datePlan = await planService.getPlanForDate(date);
      set({ isLoading: false });
      return datePlan;
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to fetch plan for date", isLoading: false });
      return null;
    }
  },

  // CRUD actions
  createPlan: async (data: CreatePlanData) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await planService.createPlan(data);
      set({ plan, isLoading: false });
      return plan;
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to create plan", isLoading: false });
      throw error;
    }
  },

  updatePlan: async (data: Partial<CreatePlanData>) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await planService.updatePlan(data);
      set({ plan, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to update plan", isLoading: false });
      throw error;
    }
  },

  deletePlan: async () => {
    set({ isLoading: true, error: null });
    try {
      await planService.deletePlan();
      set({ plan: null, todayPlan: null, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || "Failed to delete plan", isLoading: false });
      throw error;
    }
  },

  // Wizard Navigation
  setWizardStep: (step: number) => set({ wizardStep: step }),
  nextStep: () => set((state) => ({ wizardStep: Math.min(state.wizardStep + 1, 4) })),
  prevStep: () => set((state) => ({ wizardStep: Math.max(state.wizardStep - 1, 0) })),

  // Wizard Profile
  setWizardProfile: (profile) =>
    set((state) => ({
      wizardProfile: { ...state.wizardProfile, ...profile },
    })),

  // Wizard Diet
  setWizardMeals: (meals) => set({ wizardMeals: meals }),

  addMeal: (name: string) =>
    set((state) => ({
      wizardMeals: [...state.wizardMeals, { name, items: [] }],
    })),

  removeMeal: (index: number) =>
    set((state) => ({
      wizardMeals: state.wizardMeals.filter((_, i) => i !== index),
    })),

  updateMealName: (index: number, name: string) =>
    set((state) => ({
      wizardMeals: state.wizardMeals.map((meal, i) =>
        i === index ? { ...meal, name } : meal
      ),
    })),

  addFoodItem: (mealIndex: number, item: FoodItem) =>
    set((state) => ({
      wizardMeals: state.wizardMeals.map((meal, i) =>
        i === mealIndex ? { ...meal, items: [...meal.items, item] } : meal
      ),
    })),

  removeFoodItem: (mealIndex: number, itemIndex: number) =>
    set((state) => ({
      wizardMeals: state.wizardMeals.map((meal, i) =>
        i === mealIndex
          ? { ...meal, items: meal.items.filter((_, j) => j !== itemIndex) }
          : meal
      ),
    })),

  updateFoodItem: (mealIndex: number, itemIndex: number, item: FoodItem) =>
    set((state) => ({
      wizardMeals: state.wizardMeals.map((meal, i) =>
        i === mealIndex
          ? {
              ...meal,
              items: meal.items.map((existing, j) =>
                j === itemIndex ? item : existing
              ),
            }
          : meal
      ),
    })),

  // Wizard Workout
  setWizardDayTypes: (dayTypes) => set({ wizardDayTypes: dayTypes }),

  addDayType: (name: string) =>
    set((state) => ({
      wizardDayTypes: [
        ...state.wizardDayTypes,
        { id: generateId(), name, exercises: [] },
      ],
    })),

  removeDayType: (id: string) =>
    set((state) => ({
      wizardDayTypes: state.wizardDayTypes.filter((dt) => dt.id !== id),
      // Also remove from schedule
      wizardSchedule: Object.fromEntries(
        Object.entries(state.wizardSchedule).map(([day, dayTypeId]) => [
          day,
          dayTypeId === id ? null : dayTypeId,
        ])
      ) as WeeklySchedule,
    })),

  updateDayTypeName: (id: string, name: string) =>
    set((state) => ({
      wizardDayTypes: state.wizardDayTypes.map((dt) =>
        dt.id === id ? { ...dt, name } : dt
      ),
    })),

  addExercise: (dayTypeId: string, exercise: PlanExercise) =>
    set((state) => ({
      wizardDayTypes: state.wizardDayTypes.map((dt) =>
        dt.id === dayTypeId
          ? { ...dt, exercises: [...dt.exercises, exercise] }
          : dt
      ),
    })),

  removeExercise: (dayTypeId: string, exerciseIndex: number) =>
    set((state) => ({
      wizardDayTypes: state.wizardDayTypes.map((dt) =>
        dt.id === dayTypeId
          ? { ...dt, exercises: dt.exercises.filter((_, i) => i !== exerciseIndex) }
          : dt
      ),
    })),

  updateExercise: (dayTypeId: string, exerciseIndex: number, exercise: PlanExercise) =>
    set((state) => ({
      wizardDayTypes: state.wizardDayTypes.map((dt) =>
        dt.id === dayTypeId
          ? {
              ...dt,
              exercises: dt.exercises.map((ex, i) =>
                i === exerciseIndex ? exercise : ex
              ),
            }
          : dt
      ),
    })),

  // Wizard Schedule
  setWizardSchedule: (schedule) => set({ wizardSchedule: schedule }),

  setDayWorkout: (day: keyof WeeklySchedule, dayTypeId: string | null) =>
    set((state) => ({
      wizardSchedule: { ...state.wizardSchedule, [day]: dayTypeId },
    })),

  // Wizard Targets
  setWizardWaterTarget: (water: number) => set({ wizardWaterTarget: water }),

  // Wizard Helpers
  getCalculatedTargets: () => {
    const state = get();
    const macros = calculateMacrosFromMeals(state.wizardMeals);
    return {
      ...macros,
      water: state.wizardWaterTarget,
    };
  },

  resetWizard: () =>
    set({
      wizardStep: 0,
      wizardProfile: { weight: 70, height: 170, goal: "maintenance" },
      wizardMeals: [...defaultMeals],
      wizardDayTypes: [],
      wizardSchedule: { ...defaultWeeklySchedule },
      wizardWaterTarget: 3,
    }),

  initializeWizardFromPlan: (plan: Plan) => {
    set({
      wizardMeals: plan.diet.meals.length > 0 ? plan.diet.meals : [...defaultMeals],
      wizardDayTypes: plan.workout.dayTypes,
      wizardSchedule: plan.workout.weeklySchedule,
      wizardWaterTarget: plan.targets.water,
    });
  },

  submitWizard: async () => {
    const state = get();
    const targets = state.getCalculatedTargets();

    const planData: CreatePlanData = {
      diet: {
        meals: state.wizardMeals,
      },
      workout: {
        dayTypes: state.wizardDayTypes,
        weeklySchedule: state.wizardSchedule,
      },
      targets,
    };

    const plan = await state.createPlan(planData);
    return plan;
  },

  clearError: () => set({ error: null }),
}));
