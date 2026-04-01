import { Router } from "express";
import {
  getUser,
  updateUser,
  updateUserSchema,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getUser);
router.put("/", validate(updateUserSchema), updateUser);

export default router;
