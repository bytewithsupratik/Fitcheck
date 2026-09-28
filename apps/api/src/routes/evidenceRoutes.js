import { Router } from "express";
import { evidenceController } from "../controllers/evidenceController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public health probe
router.get("/evidence/health", evidenceController.getHealth);

// Explicitly protected routes
router.post("/evidence/github", requireAuth, evidenceController.submitGithub);
router.post("/evidence/report", requireAuth, evidenceController.submitReport);
router.post("/evidence/assessment", requireAuth, evidenceController.submitAssessment);
router.post("/evidence/evaluate", requireAuth, evidenceController.submitRaw);

export default router;