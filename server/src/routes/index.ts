import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import planRoutes from "./plan.routes.js";
import dietRoutes from "./diet.routes.js";
import workoutRoutes from "./workout.routes.js";
import progressRoutes from "./progress.routes.js";
import insightsRoutes from "./insights.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/plan", planRoutes);
router.use("/diet", dietRoutes);
router.use("/workout", workoutRoutes);
router.use("/progress", progressRoutes);
router.use("/insights", insightsRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
