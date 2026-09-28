import { Router } from "express";
import { gymController } from "../controllers/gymController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All Gym operations require an authenticated learner
router.use(requireAuth);

router.get("/gym/challenges", gymController.getChallenges);
router.post("/gym/verify-repo", gymController.verifyRepo);
router.post("/gym/submit-code", gymController.submitCode);

export default router;