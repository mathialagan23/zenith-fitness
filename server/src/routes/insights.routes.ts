import { Router } from "express";
import { getInsights } from "../controllers/insights.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getInsights);

export default router;
