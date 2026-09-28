import { Router } from "express";
import { mieController } from "../controllers/mieController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/learning/generate", requireAuth, mieController.generateExperience);
router.get("/learning/experiences/:id", requireAuth, mieController.getExperienceById);
router.get("/learning/current", requireAuth, mieController.getCurrentExperience);
router.get("/learning/experiences/:id/resources", requireAuth, mieController.getResources);
router.get("/learning/experiences/:id/project", requireAuth, mieController.getProject);
router.post("/learning/projects/:projectId/submission", requireAuth, mieController.submitProject);
router.get("/learning/experiences/:id/assessment", requireAuth, mieController.getAssessment);
router.post("/learning/assessments/:assessmentId/attempts", requireAuth, mieController.startAssessmentAttempt);
router.post("/learning/assessments/:assessmentId/submit", requireAuth, mieController.submitAssessment);
router.post("/learning/experiences/:id/steps/:stepId/complete", requireAuth, mieController.completeStep);

export default router;