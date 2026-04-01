import { Response } from "express";
import { Plan, User } from "../models/index.js";
import { AuthRequest, ApiResponse, IPlan, IWeeklySchedule } from "../types/index.js";
import { logger } from "../utils/logger.js";

// ============================================
// DTO MAPPERS - Clean API responses
// ============================================

interface FoodItemDTO {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PlanMealDTO {
  name: string;
  time?: string;
  items: FoodItemDTO[];
}

interface PlanExerciseDTO {
  name: string;
  targetSets: number;
  targetReps: string;
  exerciseType?: "compound" | "isolation" | "bodyweight";
  notes?: string;
}

interface WorkoutDayTypeDTO {
  id: string;
  name: string;
  exercises: PlanExerciseDTO[];
}

interface WeeklyScheduleDTO {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
}

interface PlanTargetsDTO {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

interface PlanDTO {
  diet: {
    meals: PlanMealDTO[];
  };
  workout: {
    dayTypes: WorkoutDayTypeDTO[];
    weeklySchedule: WeeklyScheduleDTO;
  };
  targets: PlanTargetsDTO;
}

// Map Plan document to clean DTO (no _id, userId, __v, timestamps)
const toPlanDTO = (doc: IPlan): PlanDTO => ({
  diet: {
    meals: doc.diet.meals.map((meal) => ({
      name: meal.name,
      ...(meal.time && { time: meal.time }),
      items: meal.items.map((item) => ({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    })),
  },
  workout: {
    dayTypes: doc.workout.dayTypes.map((dt) => ({
      id: dt.id,
      name: dt.name,
      exercises: dt.exercises.map((ex) => ({
        name: ex.name,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        ...(ex.exerciseType && { exerciseType: ex.exerciseType }),
        ...(ex.notes && { notes: ex.notes }),
      })),
    })),
    weeklySchedule: {
      monday: doc.workout.weeklySchedule.monday,
      tuesday: doc.workout.weeklySchedule.tuesday,
      wednesday: doc.workout.weeklySchedule.wednesday,
      thursday: doc.workout.weeklySchedule.thursday,
      friday: doc.workout.weeklySchedule.friday,
      saturday: doc.workout.weeklySchedule.saturday,
      sunday: doc.workout.weeklySchedule.sunday,
    },
  },
  targets: {
    calories: doc.targets.calories,
    protein: doc.targets.protein,
    carbs: doc.targets.carbs,
    fat: doc.targets.fat,
    water: doc.targets.water,
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper to calculate targets from meals
const calculateTargetsFromMeals = (meals: IPlan["diet"]["meals"]) => {
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

// Helper to get day name from date
const getDayName = (date: Date): keyof IWeeklySchedule => {
  const days: (keyof IWeeklySchedule)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
};

/**
 * @desc    Get user's plan
 * @route   GET /api/plan
 * @access  Private
 */
export const getPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse<PlanDTO | null>>
) => {
  try {
    const plan = await Plan.findOne({ userId: req.user!.id });

    res.json({
      success: true,
      data: plan ? toPlanDTO(plan) : null,
    });
  } catch (error) {
    logger.error("Get plan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch plan",
    });
  }
};

/**
 * @desc    Create or replace user's plan
 * @route   POST /api/plan
 * @access  Private
 */
export const createPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse<PlanDTO>>
) => {
  try {
    const { diet, workout, targets } = req.body;

    // Calculate targets from meals if not provided or needs auto-calculation
    const calculatedMacros = calculateTargetsFromMeals(diet?.meals || []);
    const finalTargets = {
      calories: targets?.calories ?? calculatedMacros.calories,
      protein: targets?.protein ?? calculatedMacros.protein,
      carbs: targets?.carbs ?? calculatedMacros.carbs,
      fat: targets?.fat ?? calculatedMacros.fat,
      water: targets?.water ?? 3, // Default 3L
    };

    // Upsert the plan (create or replace)
    const plan = await Plan.findOneAndUpdate(
      { userId: req.user!.id },
      {
        userId: req.user!.id,
        diet: diet || { meals: [] },
        workout: workout || {
          dayTypes: [],
          weeklySchedule: {
            monday: null,
            tuesday: null,
            wednesday: null,
            thursday: null,
            friday: null,
            saturday: null,
            sunday: null,
          },
        },
        targets: finalTargets,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Mark user as having completed setup
    await User.findByIdAndUpdate(req.user!.id, { hasCompletedSetup: true });

    res.status(201).json({
      success: true,
      data: toPlanDTO(plan),
      message: "Plan created successfully",
    });
  } catch (error) {
    logger.error("Create plan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to create plan",
    });
  }
};

/**
 * @desc    Update user's plan (partial update)
 * @route   PUT /api/plan
 * @access  Private
 */
export const updatePlan = async (
  req: AuthRequest,
  res: Response<ApiResponse<PlanDTO>>
) => {
  try {
    const { diet, workout, targets } = req.body;

    const existingPlan = await Plan.findOne({ userId: req.user!.id });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: "Plan not found. Create a plan first.",
      });
    }

    // Build update object with only provided fields
    const updateData: Partial<IPlan> = {};

    if (diet !== undefined) {
      updateData.diet = diet;

      // Recalculate targets if diet changes and targets not explicitly provided
      if (!targets) {
        const calculatedMacros = calculateTargetsFromMeals(diet.meals || []);
        updateData.targets = {
          ...existingPlan.targets,
          calories: calculatedMacros.calories,
          protein: calculatedMacros.protein,
          carbs: calculatedMacros.carbs,
          fat: calculatedMacros.fat,
        };
      }
    }

    if (workout !== undefined) {
      updateData.workout = workout;
    }

    if (targets !== undefined) {
      updateData.targets = {
        ...existingPlan.targets,
        ...targets,
      };
    }

    const plan = await Plan.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: toPlanDTO(plan!),
      message: "Plan updated successfully",
    });
  } catch (error) {
    logger.error("Update plan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to update plan",
    });
  }
};

/**
 * @desc    Delete user's plan
 * @route   DELETE /api/plan
 * @access  Private
 */
export const deletePlan = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const result = await Plan.findOneAndDelete({ userId: req.user!.id });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    // Reset user's setup status
    await User.findByIdAndUpdate(req.user!.id, { hasCompletedSetup: false });

    res.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    logger.error("Delete plan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to delete plan",
    });
  }
};

/**
 * @desc    Get today's plan (meals + scheduled workout)
 * @route   GET /api/plan/today
 * @access  Private
 */
export const getTodayPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const plan = await Plan.findOne({ userId: req.user!.id });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: "No plan found. Please create a plan first.",
      });
    }

    const today = new Date();
    const dayName = getDayName(today);
    const scheduledDayTypeId = plan.workout.weeklySchedule[dayName];

    // Find the workout day type for today
    let todayWorkout: WorkoutDayTypeDTO | null = null;
    if (scheduledDayTypeId) {
      const found = plan.workout.dayTypes.find(
        (dt) => dt.id === scheduledDayTypeId
      );
      if (found) {
        todayWorkout = {
          id: found.id,
          name: found.name,
          exercises: found.exercises.map((ex) => ({
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            ...(ex.exerciseType && { exerciseType: ex.exerciseType }),
            ...(ex.notes && { notes: ex.notes }),
          })),
        };
      }
    }

    // Map meals to clean DTO
    const mealsDTO: PlanMealDTO[] = plan.diet.meals.map((meal) => ({
      name: meal.name,
      ...(meal.time && { time: meal.time }),
      items: meal.items.map((item) => ({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    }));

    // Map targets to clean DTO
    const targetsDTO: PlanTargetsDTO = {
      calories: plan.targets.calories,
      protein: plan.targets.protein,
      carbs: plan.targets.carbs,
      fat: plan.targets.fat,
      water: plan.targets.water,
    };

    res.json({
      success: true,
      data: {
        date: today.toISOString().split("T")[0],
        dayOfWeek: dayName,
        meals: mealsDTO,
        workout: todayWorkout,
        isRestDay: !todayWorkout,
        targets: targetsDTO,
      },
    });
  } catch (error) {
    logger.error("Get today plan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch today's plan",
    });
  }
};

/**
 * @desc    Get plan for a specific date
 * @route   GET /api/plan/date/:date
 * @access  Private
 */
export const getPlanForDate = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    const plan = await Plan.findOne({ userId: req.user!.id });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: "No plan found. Please create a plan first.",
      });
    }

    const dayName = getDayName(targetDate);
    const scheduledDayTypeId = plan.workout.weeklySchedule[dayName];

    // Find the workout day type for the date
    let dateWorkout: WorkoutDayTypeDTO | null = null;
    if (scheduledDayTypeId) {
      const found = plan.workout.dayTypes.find(
        (dt) => dt.id === scheduledDayTypeId
      );
      if (found) {
        dateWorkout = {
          id: found.id,
          name: found.name,
          exercises: found.exercises.map((ex) => ({
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            ...(ex.exerciseType && { exerciseType: ex.exerciseType }),
            ...(ex.notes && { notes: ex.notes }),
          })),
        };
      }
    }

    // Map meals to clean DTO
    const mealsDTO: PlanMealDTO[] = plan.diet.meals.map((meal) => ({
      name: meal.name,
      ...(meal.time && { time: meal.time }),
      items: meal.items.map((item) => ({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    }));

    // Map targets to clean DTO
    const targetsDTO: PlanTargetsDTO = {
      calories: plan.targets.calories,
      protein: plan.targets.protein,
      carbs: plan.targets.carbs,
      fat: plan.targets.fat,
      water: plan.targets.water,
    };

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split("T")[0],
        dayOfWeek: dayName,
        meals: mealsDTO,
        workout: dateWorkout,
        isRestDay: !dateWorkout,
        targets: targetsDTO,
      },
    });
  } catch (error) {
    logger.error("Get plan for date error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch plan for date",
    });
  }
};
