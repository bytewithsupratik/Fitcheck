import { Router } from "express";
import { checkDatabaseHealth } from "../db/health.js";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    await checkDatabaseHealth();
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", message: error.message });
  }
});

export default router;