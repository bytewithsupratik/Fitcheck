import { Router } from "express";
import { rieController } from "../controllers/rieController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// 1. Calculate fresh readiness
router.post("/readiness/evaluate", requireAuth, rieController.evaluate);

// 2. Read current readiness state
router.get("/readiness/current", requireAuth, rieController.getCurrent);

// 3. Read historical readiness trend
router.get("/readiness/history", requireAuth, rieController.getHistory);

// 4. Generate the handoff payload for MIE
router.post("/readiness/handoff/mie", requireAuth, rieController.handoffMIE);

export default router;