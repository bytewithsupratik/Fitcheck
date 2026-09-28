import { Router } from "express";
import { upeController } from "../controllers/upeController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/progress/evaluate", requireAuth, upeController.evaluate);
router.get("/progress/current", requireAuth, upeController.getCurrent);
router.get("/progress/history", requireAuth, upeController.getHistory);
router.get("/progress/capabilities", requireAuth, upeController.getCapabilities);
router.get("/progress/trend", requireAuth, upeController.getTrend);

export default router;