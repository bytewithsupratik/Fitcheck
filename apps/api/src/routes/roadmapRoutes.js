import { Router } from "express";
import { roadmapController } from "../controllers/roadmapController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/roadmap/track", requireAuth, roadmapController.getTrack);

export default router;