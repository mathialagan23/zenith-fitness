import { Response } from "express";
import { z } from "zod";
import { Progress } from "../models/index.js";
import { AuthRequest, IProgress } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { startOfDay, parseISO } from "date-fns";

// ============================================
// DTO MAPPERS - Clean API responses
// ============================================

interface MeasurementsDTO {
  chest?: number;
  waist?: number;
  arms?: number;
  thighs?: number;
}

interface ProgressDTO {
  date: string;
  weight: number;
  bodyFat?: number;
  measurements?: MeasurementsDTO;
  notes?: string;
}

// Map Progress document to clean DTO (no _id, userId, __v, createdAt)
const toProgressDTO = (doc: IProgress): ProgressDTO => ({
  date: doc.date.toISOString(),
  weight: doc.weight,
  ...(doc.bodyFat !== undefined && { bodyFat: doc.bodyFat }),
  ...(doc.measurements && {
    measurements: {
      ...(doc.measurements.chest !== undefined && { chest: doc.measurements.chest }),
      ...(doc.measurements.waist !== undefined && { waist: doc.measurements.waist }),
      ...(doc.measurements.arms !== undefined && { arms: doc.measurements.arms }),
      ...(doc.measurements.thighs !== undefined && { thighs: doc.measurements.thighs }),
    },
  }),
  ...(doc.notes && { notes: doc.notes }),
});

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Validation schemas
export const logProgressSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    weight: z.number().min(30).max(300),
    bodyFat: z.number().min(1).max(60).optional(),
    measurements: z.object({
      chest: z.number().min(0).optional(),
      waist: z.number().min(0).optional(),
      arms: z.number().min(0).optional(),
      thighs: z.number().min(0).optional(),
    }).optional(),
    notes: z.string().max(500).optional(),
  }),
});

// Log progress - ALWAYS create a new entry (do not overwrite history)
export const logProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, weight, bodyFat, measurements, notes } = req.body;
    // Use full Date (with time) so each entry is unique and sortable by actual log time
    const logDate = date ? parseISO(date) : new Date();

    const progress = await Progress.create({
      userId: req.user?.id,
      date: logDate,
      weight,
      ...(bodyFat !== undefined && { bodyFat }),
      ...(measurements && { measurements }),
      ...(notes && { notes }),
    });

    res.json({
      success: true,
      data: toProgressDTO(progress),
    });
  } catch (error) {
    logger.error("LogProgress error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to log progress",
    });
  }
};

// Get progress history - sorted ASC by date, then createdAt (deterministic)
export const getProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limitParam = req.query.limit as string;
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const query: Record<string, unknown> = { userId: req.user?.id };

    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(parseISO(startDate)),
        $lte: startOfDay(parseISO(endDate)),
      };
    }

    let q = Progress.find(query).sort({ date: 1, createdAt: 1 }); // oldest -> newest (stable)
    if (limit && limit > 0) {
      q = q.limit(limit);
    }

    const progress = await q;

    res.json({
      success: true,
      data: progress.map(toProgressDTO),
    });
  } catch (error) {
    logger.error("GetProgress error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get progress",
    });
  }
};

// Get latest progress entry
export const getLatestProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const progress = await Progress.findOne({ userId: req.user?.id })
      .sort({ date: -1 });

    res.json({
      success: true,
      data: progress ? toProgressDTO(progress) : null,
    });
  } catch (error) {
    logger.error("GetLatestProgress error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get latest progress",
    });
  }
};

// Get aggregated progress summary (for dashboard / insights)
export const getProgressSummary = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const entries = await Progress.find({ userId: req.user?.id })
	  .sort({ date: 1, createdAt: 1 }); // oldest -> newest (stable)

    if (entries.length === 0) {
      res.json({
        success: true,
        data: null,
      });
      return;
    }

    const weights = entries.map((e) => e.weight);
    const startingWeight = weights[0];
    const currentWeight = weights[weights.length - 1];
    const lowestWeight = Math.min(...weights);
    const highestWeight = Math.max(...weights);

    const changeFromStart = Number((currentWeight - startingWeight).toFixed(1));
    const percentChangeFromStart =
      startingWeight > 0
        ? Number(((changeFromStart / startingWeight) * 100).toFixed(1))
        : 0;

    const totalWeightLost =
      startingWeight > currentWeight
        ? Number((startingWeight - currentWeight).toFixed(1))
        : 0;

    // Previous week logic
    let previousWeekWeight: number | null = null;
    let changeFromPreviousWeek: number | null = null;
    let percentChangeFromPreviousWeek: number | null = null;

    if (entries.length > 1) {
      const today = new Date();
      const targetTime = today.getTime() - 7 * 24 * 60 * 60 * 1000;

      let candidate: (typeof entries)[number] | null = null;
      for (const entry of entries) {
        const entryTime = entry.date.getTime();
        if (entryTime <= targetTime) {
          candidate = entry; // latest entry before or on target date
        } else {
          break;
        }
      }

      if (!candidate) {
        // No entry as old as 7 days ago; fall back to earliest entry
        candidate = entries[0];
      }

      previousWeekWeight = candidate.weight;
      changeFromPreviousWeek = Number(
        (currentWeight - previousWeekWeight).toFixed(1)
      );
      percentChangeFromPreviousWeek =
        previousWeekWeight > 0
          ? Number(
              ((changeFromPreviousWeek / previousWeekWeight) * 100).toFixed(1)
            )
          : 0;
    }

    res.json({
      success: true,
      data: {
        currentWeight,
        startingWeight,
        lowestWeight,
        highestWeight,
        changeFromStart,
        percentChangeFromStart,
        totalWeightLost,
        previousWeekWeight,
        changeFromPreviousWeek,
        percentChangeFromPreviousWeek,
      },
    });
  } catch (error) {
    logger.error("GetProgressSummary error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get progress summary",
    });
  }
};
