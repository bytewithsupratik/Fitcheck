import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard/metrics", requireAuth, dashboardController.getMetrics);
router.get("/dashboard/evidence", requireAuth, dashboardController.getEvidence);

export default router;