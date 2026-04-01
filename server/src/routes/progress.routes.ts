import { Router } from "express";
import {
	logProgress,
	getProgress,
	getLatestProgress,
	getProgressSummary,
	logProgressSchema,
} from "../controllers/progress.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(logProgressSchema), logProgress);
router.get("/", getProgress);
router.get("/latest", getLatestProgress);
router.get("/summary", getProgressSummary);

export default router;
