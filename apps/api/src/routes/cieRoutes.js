import { Router } from "express";
import { cieController } from "../controllers/cieController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public / Exploration Endpoints
router.get("/career/targets", cieController.getTargets);
router.get("/career/targets/:targetId", cieController.getTargetProfile);
router.get("/career/targets/:targetId/roadmap", cieController.getTargetRoadmap);

// Authenticated Evaluation Endpoint
router.post("/career/evaluate", requireAuth, cieController.evaluate);

export default router;