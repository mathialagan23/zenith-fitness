import { Router } from "express";
import {
  getDietPlan,
  updateDietPlan,
  logFood,
  getFoodLog,
  getFoodLogs,
  updateMealStatus,
  addExtraItem,
  removeExtraItem,
  updateWaterIntake,
  updateFoodLogSchema,
} from "../controllers/diet.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Legacy diet plan routes (now use Plan model under the hood)
router.get("/plan", getDietPlan);
router.put("/plan", updateDietPlan);

// Food log routes - New plan-driven endpoints
router.get("/log", getFoodLog);
router.post("/log", validate(updateFoodLogSchema), logFood);
router.get("/logs", getFoodLogs);

// Meal status management
router.patch("/log/meal-status", updateMealStatus);

// Extra items management
router.post("/log/extra-item", addExtraItem);
router.delete("/log/extra-item", removeExtraItem);

// Water intake
router.patch("/log/water", updateWaterIntake);

export default router;
