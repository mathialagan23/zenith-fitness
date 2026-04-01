// App configuration constants
export const APP_NAME = "ZENITH";
export const APP_DESCRIPTION = "Fitness Tracker";

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Default targets
export const DEFAULT_TARGETS = {
  calories: { min: 1800, max: 2200 },
  protein: { min: 120, max: 150 },
  carbs: { min: 200, max: 250 },
  fat: { min: 50, max: 70 },
  water: 3,
};

// Workout day types
export const WORKOUT_DAYS = ["Push", "Pull", "Legs", "Rest"] as const;

// Meal types
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;

// Goal options
export const GOAL_OPTIONS = [
  { value: "cutting", label: "Cutting (Fat Loss)" },
  { value: "bulking", label: "Bulking (Muscle Gain)" },
  { value: "maintenance", label: "Maintenance" },
  { value: "recomposition", label: "Body Recomposition" },
] as const;

// Color mappings
export const GLOW_COLORS = {
  purple: "glow-purple",
  red: "glow-red",
  blue: "glow-blue",
  green: "glow-green",
} as const;

// Animation variants
export const FADE_IN_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "zenith_token",
  USER: "zenith_user",
  THEME: "zenith_theme",
} as const;
