import { adeService } from "../services/adeService.js";

export const adeController = {
  // POST /ade/trigger
  async trigger(req, res, next) {
    try {
      const decision = await adeService.triggerAdaptation(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({
        message: "ADE evaluation completed",
        data: decision,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /ade/decisions/current
  async getCurrent(req, res, next) {
    try {
      const decision = await adeService.getCurrentDecision(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data: decision });
    } catch (error) {
      next(error);
    }
  },

  // GET /ade/decisions/history
  async getHistory(req, res, next) {
    try {
      const history = await adeService.getHistory(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data: history });
    } catch (error) {
      next(error);
    }
  },

  // GET /ade/decisions/:decisionId
  async getDecision(req, res, next) {
    try {
      const decision = await adeService.getDecision(req.params.decisionId, {
        requestId: req.requestId,
      });
      res.status(200).json({ data: decision });
    } catch (error) {
      next(error);
    }
  },

  // POST /ade/decisions/:decisionId/approve
  async approve(req, res, next) {
    try {
      const result = await adeService.approveDecision(req.params.decisionId, {
        requestId: req.requestId,
      });
      res.status(200).json({
        message: "Decision approved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /ade/decisions/:decisionId/reject
  async reject(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await adeService.rejectDecision(req.params.decisionId, reason, {
        requestId: req.requestId,
      });
      res.status(200).json({
        message: "Decision rejected successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};