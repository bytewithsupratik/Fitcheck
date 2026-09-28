import { rieService } from "../services/rieService.js";

export const rieController = {
  async evaluate(req, res, next) {
    try {
      const result = await rieService.evaluateReadiness(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });

      res.status(200).json({
        message: "Readiness evaluated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrent(req, res, next) {
    try {
      const result = await rieService.getCurrentReadiness(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });

      res.status(200).json({
        message: "Current readiness retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
  async getHistory(req, res, next) {
    try {
      const history = await rieService.getReadinessHistory(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });

      res.status(200).json({
        message: "Readiness history retrieved successfully",
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },

  async handoffMIE(req, res, next) {
    try {
      const handoff = await rieService.generateMIEHandoff(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });

      res.status(200).json({
        message: "MIE handoff generated successfully",
        data: handoff,
      });
    } catch (error) {
      next(error);
    }
  },
};