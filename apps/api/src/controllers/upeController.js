import { upeService } from "../services/upeService.js";

export const upeController = {
  // 1. POST /progress/evaluate
  async evaluate(req, res, next) {
    try {
      const data = await upeService.evaluateProgress(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({ message: "Progress evaluated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  // 2. GET /progress/current
  async getCurrent(req, res, next) {
    try {
      const data = await upeService.getCurrentProgress(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 3. GET /progress/history
  async getHistory(req, res, next) {
    try {
      const data = await upeService.getProgressHistory(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 4. GET /progress/capabilities
  async getCapabilities(req, res, next) {
    try {
      const data = await upeService.getCapabilitiesProgress(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 5. GET /progress/trend
  async getTrend(req, res, next) {
    try {
      const data = await upeService.getProgressTrend(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },
};