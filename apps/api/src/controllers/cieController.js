import { cieService } from "../services/cieService.js";

export const cieController = {
  // GET /career/targets?target_type=CAREER
  async getTargets(req, res, next) {
    try {
      const targets = await cieService.getAvailableTargets(
        req.query.target_type,
        { requestId: req.requestId }
      );
      res.status(200).json({ targets });
    } catch (error) {
      next(error);
    }
  },

  // GET /career/targets/:targetId
  async getTargetProfile(req, res, next) {
    try {
      const profile = await cieService.getTargetProfile(
        req.params.targetId,
        { requestId: req.requestId }
      );
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  },

  // GET /career/targets/:targetId/roadmap
  async getTargetRoadmap(req, res, next) {
    try {
      const roadmap = await cieService.getTargetRoadmap(
        req.params.targetId,
        { requestId: req.requestId }
      );
      res.status(200).json({ roadmap });
    } catch (error) {
      next(error);
    }
  },

  // POST /career/evaluate
  async evaluate(req, res, next) {
    try {
      const result = await cieService.evaluateCurrentTarget(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({
        message: "CIE evaluation successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};