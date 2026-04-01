// Insights data
export interface Insights {
	proteinConsistency: number;
	workoutAdherence: number;
	weightTrend: "up" | "down" | "stable";
	weightChange: number;
	avgCaloriesConsumed: number;
	avgCaloriesBurned: number;
	totalWorkouts: number;
	currentStreak: number;
	highlights: string[];

	// Extended fields for richer UI
	proteinGoalDays: number;
	workoutsCompleted: number;
	avgCalories: number;
	avgProtein: number;
	caloriesBurned: number;
	totalVolume: number;
	recommendations: string[];
}

// Stat card data
export interface StatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "purple" | "red" | "blue" | "green";
}
