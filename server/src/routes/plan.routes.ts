import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getTodayPlan,
  getPlanForDate,
} from "../controllers/plan.controller.js";

const router = Router();

// All routes require authentication
router.use(protect);

// Plan CRUD operations
router.route("/")
  .get(getPlan)      // GET /api/plan - Get user's plan
  .post(createPlan)  // POST /api/plan - Create/replace plan
  .put(updatePlan)   // PUT /api/plan - Update plan (partial)
  .delete(deletePlan); // DELETE /api/plan - Delete plan

// Today's plan (meals + scheduled workout)
router.get("/today", getTodayPlan);

// Plan for specific date
router.get("/date/:date", getPlanForDate);

export default router;
