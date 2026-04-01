import { Response } from "express";
import { z } from "zod";
import { FoodLog, Plan } from "../models/index.js";
import { AuthRequest, IFoodLog } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { startOfDay, parseISO } from "date-fns";

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

interface PlannedMealDTO {
  mealName: string;
  status: "eaten" | "skipped" | "pending";
  items: FoodItemDTO[];
}

interface ExtraItemDTO extends FoodItemDTO {
  mealContext?: string;
}

interface FoodLogDTO {
  date: string;
  plannedMeals: PlannedMealDTO[];
  extraItems: ExtraItemDTO[];
  waterIntake: number;
}

// Map FoodLog document to clean DTO (no _id, userId, __v)
const toFoodLogDTO = (doc: IFoodLog): FoodLogDTO => ({
  date: doc.date.toISOString(),
  plannedMeals: doc.plannedMeals.map((meal) => ({
    mealName: meal.mealName,
    status: meal.status,
    items: meal.items.map((item) => ({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    })),
  })),
  extraItems: doc.extraItems.map((item) => ({
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    ...(item.mealContext && { mealContext: item.mealContext }),
  })),
  waterIntake: doc.waterIntake,
});

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Validation schemas
const foodItemSchema = z.object({
  name: z.string().min(1).max(100),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0).optional().default(0),
  fat: z.number().min(0).optional().default(0),
});

const plannedMealLogSchema = z.object({
  mealName: z.string(),
  status: z.enum(["eaten", "skipped", "pending"]),
  items: z.array(foodItemSchema),
});

const extraFoodItemSchema = z.object({
  name: z.string().min(1).max(100),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0).optional().default(0),
  fat: z.number().min(0).optional().default(0),
  mealContext: z.string().optional(),
});

export const updateFoodLogSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    plannedMeals: z.array(plannedMealLogSchema).optional(),
    extraItems: z.array(extraFoodItemSchema).optional(),
    waterIntake: z.number().min(0).max(20).optional(),
  }),
});

// Log food consumption (create/update food log)
export const logFood = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, plannedMeals, extraItems, waterIntake } = req.body;
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    const updateData: Record<string, unknown> = {};
    if (plannedMeals !== undefined) updateData.plannedMeals = plannedMeals;
    if (extraItems !== undefined) updateData.extraItems = extraItems;
    if (waterIntake !== undefined) updateData.waterIntake = waterIntake;

    const foodLog = await FoodLog.findOneAndUpdate(
      { userId: req.user?.id, date: logDate },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: toFoodLogDTO(foodLog),
    });
  } catch (error) {
    logger.error("LogFood error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to log food",
    });
  }
};

// Get food log for a specific date
export const getFoodLog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const dateStr = req.query.date as string;
    const date = dateStr ? startOfDay(parseISO(dateStr)) : startOfDay(new Date());

    let foodLog = await FoodLog.findOne({ userId: req.user?.id, date });
    const plan = await Plan.findOne({ userId: req.user?.id });

    // If no log exists, create one from Plan's meals
    if (!foodLog) {
      if (plan && plan.diet.meals.length > 0) {
        // Create food log with planned meals from the plan
        foodLog = await FoodLog.create({
          userId: req.user?.id,
          date,
          plannedMeals: plan.diet.meals.map((meal) => ({
            mealName: meal.name,
            status: "pending",
            items: meal.items,
          })),
          extraItems: [],
          waterIntake: 0,
        });
      } else {
        // No plan exists - create empty log
        foodLog = await FoodLog.create({
          userId: req.user?.id,
          date,
          plannedMeals: [],
          extraItems: [],
          waterIntake: 0,
        });
      }
    }
    // If log exists but has empty plannedMeals, populate from plan
    else if (foodLog.plannedMeals.length === 0 && plan && plan.diet.meals.length > 0) {
      foodLog.plannedMeals = plan.diet.meals.map((meal) => ({
        mealName: meal.name,
        status: "pending",
        items: meal.items,
      }));
      await foodLog.save();
      logger.debug("[Diet] Populated empty foodLog with meals from plan", {
        userId: req.user?.id,
        date,
      });
    }

    res.json({
      success: true,
      data: toFoodLogDTO(foodLog),
    });
  } catch (error) {
    logger.error("GetFoodLog error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get food log",
    });
  }
};

// Update a specific meal status
export const updateMealStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, mealIndex, status } = req.body;
    logger.debug("[Diet] updateMealStatus called", {
      date,
      mealIndex,
      status,
      userId: req.user?.id,
    });
    
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    if (!["eaten", "skipped", "pending"].includes(status)) {
      res.status(400).json({
        success: false,
        error: "Invalid status. Must be 'eaten', 'skipped', or 'pending'",
      });
      return;
    }

    let foodLog = await FoodLog.findOne({ userId: req.user?.id, date: logDate });
    logger.debug("[Diet] Existing foodLog", {
      hasFoodLog: !!foodLog,
      plannedMealsCount: foodLog?.plannedMeals.length ?? 0,
    });

    // Get the user's plan (we'll need it if foodLog doesn't exist or has empty meals)
    const plan = await Plan.findOne({ userId: req.user?.id });
    logger.debug("[Diet] Plan lookup", {
      hasPlan: !!plan,
      mealsCount: plan?.diet.meals.length ?? 0,
    });

    if (!plan || plan.diet.meals.length === 0) {
      res.status(404).json({
        success: false,
        error: "No diet plan found. Please create a plan first.",
      });
      return;
    }

    // If no food log exists, create one from Plan's meals
    if (!foodLog) {
      const plannedMealsFromPlan = plan.diet.meals.map((meal) => ({
        mealName: meal.name,
        status: "pending" as const,
        items: meal.items.map(item => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        })),
      }));
      
      foodLog = await FoodLog.create({
        userId: req.user?.id,
        date: logDate,
        plannedMeals: plannedMealsFromPlan,
        extraItems: [],
        waterIntake: 0,
      });
      logger.info("[Diet] Created new foodLog from plan", {
        userId: req.user?.id,
        mealsCount: foodLog.plannedMeals.length,
      });
    }
    // If food log exists but has empty plannedMeals, populate from plan
    else if (foodLog.plannedMeals.length === 0) {
      const plannedMealsFromPlan = plan.diet.meals.map((meal) => ({
        mealName: meal.name,
        status: "pending" as const,
        items: meal.items.map(item => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        })),
      }));
      
      foodLog.plannedMeals = plannedMealsFromPlan;
      await foodLog.save();
      logger.info("[Diet] Populated existing empty foodLog from plan", {
        userId: req.user?.id,
        mealsCount: foodLog.plannedMeals.length,
      });
    }

    if (mealIndex < 0 || mealIndex >= foodLog.plannedMeals.length) {
      logger.warn("[Diet] Invalid meal index", {
        userId: req.user?.id,
        mealIndex,
        totalMeals: foodLog.plannedMeals.length,
      });
      res.status(400).json({
        success: false,
        error: `Invalid meal index. Expected 0-${foodLog.plannedMeals.length - 1}, got ${mealIndex}`,
      });
      return;
    }

    const oldStatus = foodLog.plannedMeals[mealIndex].status;
    foodLog.plannedMeals[mealIndex].status = status;
    await foodLog.save();
    logger.info("[Diet] Updated meal status", {
      userId: req.user?.id,
      mealIndex,
      oldStatus,
      newStatus: status,
    });

    res.json({
      success: true,
      data: toFoodLogDTO(foodLog),
    });
  } catch (error) {
    logger.error("UpdateMealStatus error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to update meal status",
    });
  }
};

// Add extra food item
export const addExtraItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, item } = req.body;
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    const foodLog = await FoodLog.findOneAndUpdate(
      { userId: req.user?.id, date: logDate },
      { $push: { extraItems: item } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: toFoodLogDTO(foodLog),
    });
  } catch (error) {
    logger.error("AddExtraItem error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to add extra item",
    });
  }
};

// Remove extra food item
export const removeExtraItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, itemIndex } = req.body;
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    const foodLog = await FoodLog.findOne({ userId: req.user?.id, date: logDate });

    if (!foodLog) {
      res.status(404).json({
        success: false,
        error: "Food log not found for this date",
      });
      return;
    }

    if (itemIndex < 0 || itemIndex >= foodLog.extraItems.length) {
      res.status(400).json({
        success: false,
        error: "Invalid item index",
      });
      return;
    }

    foodLog.extraItems.splice(itemIndex, 1);
    await foodLog.save();

    res.json({
      success: true,
      data: toFoodLogDTO(foodLog),
    });
  } catch (error) {
    logger.error("RemoveExtraItem error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to remove extra item",
    });
  }
};

// Update water intake
export const updateWaterIntake = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, waterIntake } = req.body;
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    const foodLog = await FoodLog.findOneAndUpdate(
      { userId: req.user?.id, date: logDate },
      { $set: { waterIntake } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: toFoodLogDTO(foodLog),
    });
  } catch (error) {
    logger.error("UpdateWaterIntake error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to update water intake",
    });
  }
};

// Get food logs for date range (for insights)
export const getFoodLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const query: Record<string, unknown> = { userId: req.user?.id };

    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(parseISO(startDate)),
        $lte: startOfDay(parseISO(endDate)),
      };
    }

    const foodLogs = await FoodLog.find(query).sort({ date: -1 }).limit(30);

    res.json({
      success: true,
      data: foodLogs.map(toFoodLogDTO),
    });
  } catch (error) {
    logger.error("GetFoodLogs error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get food logs",
    });
  }
};

// ============================================
// LEGACY ENDPOINTS (for backward compatibility)
// These will be deprecated once migration is complete
// ============================================

// Legacy: Get diet plan (now returns Plan's diet section)
export const getDietPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const plan = await Plan.findOne({ userId: req.user?.id });

    if (!plan) {
      // Return empty diet plan structure (no internal fields)
      res.json({
        success: true,
        data: {
          meals: [
            { name: "Breakfast", items: [] },
            { name: "Lunch", items: [] },
            { name: "Dinner", items: [] },
            { name: "Snacks", items: [] },
          ],
        },
      });
      return;
    }

    // Transform Plan format to legacy DietPlan format (no _id, userId)
    res.json({
      success: true,
      data: {
        meals: plan.diet.meals.map((meal) => ({
          name: meal.name,
          time: meal.time,
          items: meal.items.map((item) => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })),
        })),
      },
    });
  } catch (error) {
    logger.error("GetDietPlan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get diet plan",
    });
  }
};

// Legacy: Update diet plan (now updates Plan's diet section)
export const updateDietPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meals } = req.body;

    const plan = await Plan.findOneAndUpdate(
      { userId: req.user?.id },
      { $set: { "diet.meals": meals } },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({
        success: false,
        error: "No plan found. Please create a plan first.",
      });
      return;
    }

    // Return in clean format (no _id, userId)
    res.json({
      success: true,
      data: {
        meals: plan.diet.meals.map((meal) => ({
          name: meal.name,
          time: meal.time,
          items: meal.items.map((item) => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })),
        })),
      },
    });
  } catch (error) {
    logger.error("UpdateDietPlan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to update diet plan",
    });
  }
};
