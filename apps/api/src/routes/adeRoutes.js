import { Router } from "express";
import { adeController } from "../controllers/adeController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/ade/trigger", requireAuth, adeController.trigger);
router.get("/ade/decisions/current", requireAuth, adeController.getCurrent);
router.get("/ade/decisions/history", requireAuth, adeController.getHistory);
router.get("/ade/decisions/:decisionId", requireAuth, adeController.getDecision);
router.post("/ade/decisions/:decisionId/approve", requireAuth, adeController.approve);
router.post("/ade/decisions/:decisionId/reject", requireAuth, adeController.reject);

export default router;