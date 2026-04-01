import { Router } from "express";
import {
  getWorkoutPlan,
  updateWorkoutPlan,
  logWorkout,
  getWorkoutLog,
  getWorkoutLogs,
  getTodayWorkout,
  markWorkoutComplete,
  getPreviousBest,
  getPreviousBests,
  logWorkoutSchema,
} from "../controllers/workout.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// New plan-driven endpoints
router.get("/today", getTodayWorkout);
router.post("/complete", markWorkoutComplete);

// Progressive overload - previous best endpoints
router.get("/previous-best", getPreviousBest);
router.post("/previous-bests", getPreviousBests);

// Workout log routes
router.post("/log", validate(logWorkoutSchema), logWorkout);
router.get("/log", getWorkoutLog);
router.get("/logs", getWorkoutLogs);

// Legacy workout plan routes (now use Plan model under the hood)
router.get("/plan", getWorkoutPlan);
router.put("/plan", updateWorkoutPlan);

export default router;
