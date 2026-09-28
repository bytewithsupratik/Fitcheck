import { Router } from "express";
import { onboardingController } from "../controllers/onboardingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Supports both "/onboarding/submit" and "/api/v1/onboarding/submit"
router.post(["/onboarding/submit", "/api/v1/onboarding/submit"], requireAuth, onboardingController.submit);

export default router;