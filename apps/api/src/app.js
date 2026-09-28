import express from "express";
import cors from "cors";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { NotFoundError } from "./utils/errors.js";

// Routes
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import cieRoutes from "./routes/cieRoutes.js";
import evidenceRoutes from "./routes/evidenceRoutes.js";
import rieRoutes from "./routes/rieRoutes.js";
import mieRoutes from "./routes/mieRoutes.js";
import upeRoutes from "./routes/upeRoutes.js";
import adeRoutes from "./routes/adeRoutes.js";
import gymRoutes from "./routes/gymRoutes.js";

const app = express();

// 1. Request ID (Must be first for tracing)
app.use(requestIdMiddleware);

// 2. CORS configuration for frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Correlation-Id"],
  })
);

// 3. JSON body parser
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    service: "CareerOS API Gateway",
    status: "healthy",
    version: "1.0.0",
  });
});

// 4. Mount Public & Protected Routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(onboardingRoutes);
app.use(roadmapRoutes);
app.use(taskRoutes);
app.use(dashboardRoutes);
app.use(cieRoutes);
app.use(evidenceRoutes);
app.use(rieRoutes);
app.use(mieRoutes);
app.use(upeRoutes);
app.use(adeRoutes);
app.use(gymRoutes);

// 5. Catch unknown routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

// 6. Global Error Handler
app.use(errorHandler);

export default app;