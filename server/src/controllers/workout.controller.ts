import { Response } from "express";
import { z } from "zod";
import { WorkoutLog, User, Plan } from "../models/index.js";
import { AuthRequest, ExerciseType, IWorkoutLog } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { startOfDay, parseISO, format, subDays } from "date-fns";
import {
  estimateCaloriesBurned,
  estimateWorkoutDuration,
} from "../utils/calculations.js";

// ============================================
// DTO MAPPERS - Clean API responses
// ============================================

interface WorkoutSetDTO {
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutExerciseDTO {
  name: string;
  sets: WorkoutSetDTO[];
  completed: boolean;
  targetSets?: number;
  targetReps?: string;
  exerciseType?: ExerciseType;
}

interface WorkoutLogDTO {
  date: string;
  dayType: string;
  dayTypeName: string;
  exercises: WorkoutExerciseDTO[];
  caloriesBurned: number;
  duration: number;
  notes?: string;
}

// Map WorkoutLog document to clean DTO (no _id, userId, __v)
const toWorkoutLogDTO = (doc: IWorkoutLog): WorkoutLogDTO => ({
  date: doc.date.toISOString(),
  dayType: doc.dayType,
  dayTypeName: doc.dayTypeName,
  exercises: doc.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map((s) => ({
      weight: s.weight,
      reps: s.reps,
      completed: s.completed,
    })),
    completed: ex.completed,
    ...(ex.targetSets !== undefined && { targetSets: ex.targetSets }),
    ...(ex.targetReps && { targetReps: ex.targetReps }),
    ...(ex.exerciseType && { exerciseType: ex.exerciseType }),
  })),
  caloriesBurned: doc.caloriesBurned,
  duration: doc.duration,
  ...(doc.notes && { notes: doc.notes }),
});

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Validation schemas - updated for new format
const logWorkoutSetSchema = z.object({
  weight: z.number().min(0),
  reps: z.number().min(0),
  completed: z.boolean(),
});

const logWorkoutExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(logWorkoutSetSchema),
  completed: z.boolean(),
  // Optional plan references
  targetSets: z.number().optional(),
  targetReps: z.string().optional(),
  exerciseType: z.enum(["compound", "isolation", "bodyweight"]).optional(),
});

export const logWorkoutSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    dayType: z.string(), // Dynamic - can be any day type ID
    dayTypeName: z.string(), // Human-readable name
    exercises: z.array(logWorkoutExerciseSchema),
    notes: z.string().max(500).optional(),
  }),
});

// Day of week type for weekly schedule
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

// Helper: Escape special regex characters to prevent regex injection
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Helper: Get previous best for an exercise from workout history
const findPreviousBest = async (
  userId: string,
  exerciseName: string,
  excludeDate?: Date
): Promise<{ weight: number; reps: number; date: Date } | null> => {
  // Search last 90 days of workout history
  const startDate = subDays(new Date(), 90);

  // Escape regex special characters to prevent injection
  const escapedName = escapeRegex(exerciseName);

  const query: Record<string, unknown> = {
    userId,
    date: { $gte: startDate },
    "exercises.name": { $regex: new RegExp(`^${escapedName}$`, "i") },
  };

  // Exclude current date if provided
  if (excludeDate) {
    query.date = { $gte: startDate, $ne: excludeDate };
  }

  const logs = await WorkoutLog.find(query).sort({ date: -1 }).limit(30);

  let bestVolume = 0;
  let best: { weight: number; reps: number; date: Date } | null = null;

  for (const log of logs) {
    for (const exercise of log.exercises) {
      if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
        for (const set of exercise.sets) {
          if (set.completed) {
            const volume = set.weight * set.reps;
            if (volume > bestVolume) {
              bestVolume = volume;
              best = {
                weight: set.weight,
                reps: set.reps,
                date: log.date,
              };
            }
          }
        }
      }
    }
  }

  return best;
};

// Get today's scheduled workout from Plan
export const getTodayWorkout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const dateStr = req.query.date as string;
    const date = dateStr ? parseISO(dateStr) : new Date();
    const dayOfWeek = format(date, "EEEE").toLowerCase() as DayOfWeek;

    const plan = await Plan.findOne({ userId: req.user?.id });

    if (!plan) {
      res.json({
        success: true,
        data: {
          isRestDay: true,
          workout: null,
          message: "No plan found. Create a plan to get scheduled workouts.",
        },
      });
      return;
    }

    const scheduledDayTypeId = plan.workout.weeklySchedule[dayOfWeek];

    if (!scheduledDayTypeId) {
      res.json({
        success: true,
        data: {
          isRestDay: true,
          workout: null,
          dayOfWeek,
        },
      });
      return;
    }

    const workout = plan.workout.dayTypes.find((dt) => dt.id === scheduledDayTypeId);

    if (!workout) {
      res.json({
        success: true,
        data: {
          isRestDay: true,
          workout: null,
          dayOfWeek,
        },
      });
      return;
    }

    // Enrich exercises with previous best data for progressive overload hints
    const enrichedExercises = await Promise.all(
      workout.exercises.map(async (exercise) => {
        const previousBest = await findPreviousBest(
          req.user?.id as string,
          exercise.name,
          startOfDay(date)
        );

        return {
          name: exercise.name,
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          exerciseType: exercise.exerciseType,
          notes: exercise.notes,
          previousBest: previousBest
            ? {
                weight: previousBest.weight,
                reps: previousBest.reps,
                date: previousBest.date.toISOString(),
              }
            : undefined,
        };
      })
    );

    res.json({
      success: true,
      data: {
        isRestDay: false,
        workout: {
          id: workout.id,
          name: workout.name,
          exercises: enrichedExercises,
        },
        dayOfWeek,
      },
    });
  } catch (error) {
    logger.error("GetTodayWorkout error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get today's workout",
    });
  }
};

// Log workout
export const logWorkout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, dayType, dayTypeName, exercises, notes } = req.body;
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    // Get user weight for calorie calculation
    const user = await User.findById(req.user?.id);
    const userWeight = user?.weight || 70;

    // Calculate calories and duration
    const caloriesBurned = estimateCaloriesBurned(exercises, userWeight);
    const duration = estimateWorkoutDuration(exercises);

    const workoutLog = await WorkoutLog.findOneAndUpdate(
      { userId: req.user?.id, date: logDate },
      {
        $set: {
          dayType,
          dayTypeName,
          exercises,
          caloriesBurned,
          duration,
          ...(notes && { notes }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: toWorkoutLogDTO(workoutLog),
    });
  } catch (error) {
    logger.error("LogWorkout error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to log workout",
    });
  }
};

// Get workout log for a specific date
export const getWorkoutLog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const dateStr = req.query.date as string;
    const date = dateStr ? startOfDay(parseISO(dateStr)) : startOfDay(new Date());

    const workoutLog = await WorkoutLog.findOne({ userId: req.user?.id, date });

    res.json({
      success: true,
      data: workoutLog ? toWorkoutLogDTO(workoutLog) : null,
    });
  } catch (error) {
    logger.error("GetWorkoutLog error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get workout log",
    });
  }
};

// Get workout logs for date range (for insights)
export const getWorkoutLogs = async (
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

    const workoutLogs = await WorkoutLog.find(query).sort({ date: -1 }).limit(30);

    res.json({
      success: true,
      data: workoutLogs.map(toWorkoutLogDTO),
    });
  } catch (error) {
    logger.error("GetWorkoutLogs error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get workout logs",
    });
  }
};

// Get previous best for a single exercise
export const getPreviousBest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const exerciseName = req.query.exerciseName as string;

    if (!exerciseName) {
      res.status(400).json({
        success: false,
        error: "exerciseName is required",
      });
      return;
    }

    const previousBest = await findPreviousBest(req.user?.id as string, exerciseName);

    res.json({
      success: true,
      data: previousBest
        ? {
            weight: previousBest.weight,
            reps: previousBest.reps,
            date: previousBest.date.toISOString(),
          }
        : null,
    });
  } catch (error) {
    logger.error("GetPreviousBest error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get previous best",
    });
  }
};

// Get previous bests for multiple exercises (batch)
export const getPreviousBests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { exerciseNames } = req.body as { exerciseNames: string[] };

    if (!exerciseNames || !Array.isArray(exerciseNames)) {
      res.status(400).json({
        success: false,
        error: "exerciseNames array is required",
      });
      return;
    }

    const results: Record<string, { weight: number; reps: number; date: string }> = {};

    await Promise.all(
      exerciseNames.map(async (name) => {
        const best = await findPreviousBest(req.user?.id as string, name);
        if (best) {
          results[name] = {
            weight: best.weight,
            reps: best.reps,
            date: best.date.toISOString(),
          };
        }
      })
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("GetPreviousBests error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get previous bests",
    });
  }
};

// Mark workout as complete (for rest days or quick completion)
export const markWorkoutComplete = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, dayType, dayTypeName } = req.body;
    const logDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    // For rest days or marking complete without details
    const workoutLog = await WorkoutLog.findOneAndUpdate(
      { userId: req.user?.id, date: logDate },
      {
        $set: {
          dayType,
          dayTypeName,
          exercises: [],
          caloriesBurned: 0,
          duration: 0,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: toWorkoutLogDTO(workoutLog),
    });
  } catch (error) {
    logger.error("MarkWorkoutComplete error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to mark workout complete",
    });
  }
};

// ============================================
// LEGACY ENDPOINTS (for backward compatibility)
// ============================================

// Legacy: Get workout plan (now returns Plan's workout section)
export const getWorkoutPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const plan = await Plan.findOne({ userId: req.user?.id });

    if (!plan) {
      // Return empty workout plan structure in legacy format (no _id, userId)
      res.json({
        success: true,
        data: {
          split: {
            Push: { name: "Push Day", exercises: [] },
            Pull: { name: "Pull Day", exercises: [] },
            Legs: { name: "Leg Day", exercises: [] },
            Rest: { name: "Rest Day", exercises: [] },
          },
        },
      });
      return;
    }

    // Transform Plan format to legacy WorkoutPlan format (no _id, userId)
    // This is a best-effort transformation for backward compatibility
    const legacySplit: Record<string, { name: string; exercises: unknown[] }> = {
      Push: { name: "Push Day", exercises: [] },
      Pull: { name: "Pull Day", exercises: [] },
      Legs: { name: "Leg Day", exercises: [] },
      Rest: { name: "Rest Day", exercises: [] },
    };

    // Map plan day types to legacy split - NOTE: no longer includes targetWeight
    for (const dayType of plan.workout.dayTypes) {
      const lowerName = dayType.name.toLowerCase();

      // Parse targetReps string to get a number for legacy format
      const parseRepsToNumber = (reps: string): number => {
        const match = reps.match(/(\d+)/);
        return match ? parseInt(match[1]) : 10;
      };

      const transformExercises = (exercises: typeof dayType.exercises) =>
        exercises.map((e) => ({
          name: e.name,
          sets: Array(e.targetSets).fill({
            weight: 0, // Legacy format expected weight, but we no longer store it in plans
            reps: parseRepsToNumber(e.targetReps),
            completed: false,
          }),
          completed: false,
        }));

      if (lowerName.includes("push")) {
        legacySplit.Push = {
          name: dayType.name,
          exercises: transformExercises(dayType.exercises),
        };
      } else if (lowerName.includes("pull")) {
        legacySplit.Pull = {
          name: dayType.name,
          exercises: transformExercises(dayType.exercises),
        };
      } else if (lowerName.includes("leg")) {
        legacySplit.Legs = {
          name: dayType.name,
          exercises: transformExercises(dayType.exercises),
        };
      }
    }

    res.json({
      success: true,
      data: {
        split: legacySplit,
      },
    });
  } catch (error) {
    logger.error("GetWorkoutPlan error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get workout plan",
    });
  }
};

// Legacy: Update workout plan (deprecated - use Plan instead)
export const updateWorkoutPlan = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  res.status(400).json({
    success: false,
    error: "This endpoint is deprecated. Please use /api/plan to manage your workout plan.",
  });
};
