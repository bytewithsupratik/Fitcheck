import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Protected profile route
router.get("/user/profile", requireAuth, userController.getProfile);

export default router;