import { Router } from "express";
import { taskController } from "../controllers/taskController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/tasks/:id/complete", requireAuth, taskController.complete);

export default router;