import { Response } from "express";
import { FoodLog, WorkoutLog, Progress, User, Plan } from "../models/index.js";
import { AuthRequest, IInsights, IPlannedMealLog, IExtraFoodItem } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { subDays, startOfDay } from "date-fns";
import {
  calculateProteinConsistency,
  calculateWorkoutAdherence,
  calculateWeightTrend,
  calculateStreak,
} from "../utils/calculations.js";

// Helper to calculate consumed macros from a food log
const calculateFoodLogTotals = (
  plannedMeals: IPlannedMealLog[],
  extraItems: IExtraFoodItem[]
) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Add eaten planned meals
  for (const meal of plannedMeals) {
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
  for (const item of extraItems) {
    totals.calories += item.calories;
    totals.protein += item.protein;
    totals.carbs += item.carbs;
    totals.fat += item.fat;
  }

  return totals;
};

export const getInsights = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 7;
    
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Get user's plan for targets
    const plan = await Plan.findOne({ userId });
    
    // Default targets if no plan exists
    const targets = plan?.targets || {
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 65,
      water: 3,
    };

    // Get food logs for the period
    const foodLogs = await FoodLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Get workout logs for the period
    const workoutLogs = await WorkoutLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Get progress data for the period
    const progressData = await Progress.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Calculate daily protein totals from new FoodLog structure
	const dailyProtein = foodLogs.map((log) => {
	  const totals = calculateFoodLogTotals(log.plannedMeals, log.extraItems);
	  return totals.protein;
	});

	// Calculate daily calories
	const dailyCalories = foodLogs.map((log) => {
	  const totals = calculateFoodLogTotals(log.plannedMeals, log.extraItems);
	  return totals.calories;
	});

	// Calculate protein consistency and goal days
	const proteinConsistency = calculateProteinConsistency(
	  dailyProtein,
	  targets.protein
	);
	const proteinGoalDays = dailyProtein.filter((p) => p >= targets.protein).length;

	// Average daily protein intake
	const avgProtein =
	  dailyProtein.length > 0
	    ? Math.round(
	        dailyProtein.reduce((a, b) => a + b, 0) / dailyProtein.length
	      )
	    : 0;

    // Calculate workout adherence based on scheduled workouts from plan
    let plannedWorkouts = Math.round((days / 7) * 4); // Default 4 workouts/week
    
    if (plan?.workout?.weeklySchedule) {
      const schedule = plan.workout.weeklySchedule;
      const scheduledDays = Object.values(schedule).filter(v => v !== null).length;
      plannedWorkouts = Math.round((days / 7) * scheduledDays);
    }

	const completedWorkouts = workoutLogs.filter(
	  (log) => log.exercises.some((e) => e.completed)
	).length;
	const workoutAdherence = calculateWorkoutAdherence(
	  completedWorkouts,
	  plannedWorkouts
	);

    // Calculate weight trend
    const weights = progressData.map((p) => p.weight);
    const { trend: weightTrend, change: weightChange } = calculateWeightTrend(weights);

	// Calculate average calories consumed
	const avgCaloriesConsumed =
	  dailyCalories.length > 0
	    ? Math.round(
	        dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length
	      )
	    : 0;

	// Calculate total and average calories burned
	const totalCaloriesBurned = workoutLogs.reduce(
	  (sum, log) => sum + log.caloriesBurned,
	  0
	);
	const avgCaloriesBurned =
	  workoutLogs.length > 0
	    ? Math.round(totalCaloriesBurned / workoutLogs.length)
	    : 0;

	// Calculate total lifted volume (kg * reps) across the period
	const totalVolume = workoutLogs.reduce((sum, log) => {
	  for (const exercise of log.exercises) {
	    for (const set of exercise.sets) {
	      if (set.completed) {
	        sum += set.weight * set.reps;
	      }
	    }
	  }
	  return sum;
	}, 0);

    // Calculate workout streak
    const workoutDates = workoutLogs
      .filter((log) => log.exercises.some((e) => e.completed))
      .map((log) => log.date);
    const currentStreak = calculateStreak(workoutDates);

	    // Generate highlights
	    const highlights: string[] = [];
		const recommendations: string[] = [];

	    if (proteinConsistency >= 80) {
	      highlights.push(`Excellent protein consistency at ${proteinConsistency}%!`);
	    } else if (proteinConsistency >= 60) {
	      highlights.push(`Good protein intake - ${proteinConsistency}% of days on target`);
	    } else {
	      highlights.push(`Focus on hitting protein goals - currently at ${proteinConsistency}%`);
		  recommendations.push("Aim to hit your protein target at least 4 days next week.");
	    }
	
	    if (workoutAdherence >= 80) {
	      highlights.push(`Great workout consistency! ${completedWorkouts}/${plannedWorkouts} sessions completed`);
	    } else if (completedWorkouts > 0) {
	      highlights.push(`${completedWorkouts} workouts completed this week`);
		  recommendations.push("Try to complete at least one more planned workout next week.");
	    } else {
		  recommendations.push("Schedule your first workout for this week to start a streak.");
		}
	
	    if (weightTrend === "down" && user.goal === "cutting") {
	      highlights.push(`On track! Weight down ${Math.abs(weightChange)}kg`);
	    } else if (weightTrend === "up" && user.goal === "bulking") {
	      highlights.push(`Gaining as planned! Weight up ${weightChange}kg`);
	    } else if (weightTrend === "stable") {
	      highlights.push("Weight is stable");
	    }
	
	    if (currentStreak >= 3) {
	      highlights.push(`${currentStreak} day workout streak! Keep it up!`);
	    }
	
	    if (avgCaloriesConsumed > 0) {
	      if (Math.abs(avgCaloriesConsumed - targets.calories) <= 200) {
	        highlights.push(`Calories on point - averaging ${avgCaloriesConsumed}/day`);
	      } else if (avgCaloriesConsumed > targets.calories + 200) {
		    recommendations.push("Your average calories are above target; tighten portions or snacks.");
		  } else if (avgCaloriesConsumed < targets.calories - 200) {
		    recommendations.push("Your average calories are below target; consider adding a small meal.");
		  }
	    }
	
	    const insights: IInsights = {
	      proteinConsistency,
	      workoutAdherence,
	      weightTrend,
	      weightChange,
	      avgCaloriesConsumed,
	      avgCaloriesBurned,
	      totalWorkouts: completedWorkouts,
	      currentStreak,
	      highlights,
		  // Extended fields for richer client UI
		  proteinGoalDays,
		  workoutsCompleted: completedWorkouts,
		  avgCalories: avgCaloriesConsumed,
		  avgProtein,
		  caloriesBurned: totalCaloriesBurned,
		  totalVolume,
		  recommendations,
	    };

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error("GetInsights error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get insights",
    });
  }
};
