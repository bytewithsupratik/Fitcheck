import { evidenceService } from "../services/evidenceService.js";

export const evidenceController = {
  // POST /evidence/github
  async submitGithub(req, res, next) {
    try {
      const result = await evidenceService.submitGithubEvidence(req.user.id, req.body, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({ message: "GitHub evidence evaluated successfully", data: result });
    } catch (error) {
      next(error);
    }
  },

  // POST /evidence/report
  async submitReport(req, res, next) {
    try {
      const result = await evidenceService.submitReportEvidence(req.user.id, req.body, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({ message: "Report evidence evaluated successfully", data: result });
    } catch (error) {
      next(error);
    }
  },

  // POST /evidence/assessment
  async submitAssessment(req, res, next) {
    try {
      const result = await evidenceService.submitAssessmentEvidence(req.user.id, req.body, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({ message: "Assessment evidence evaluated successfully", data: result });
    } catch (error) {
      next(error);
    }
  },

  // POST /evidence/evaluate (Raw observations)
  async submitRaw(req, res, next) {
    try {
      const result = await evidenceService.submitRawEvidence(req.user.id, req.body, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(200).json({ message: "Raw observations evaluated successfully", data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /evidence/health
  async getHealth(req, res, next) {
    try {
      const status = await evidenceService.getHealth({ requestId: req.requestId });
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  },
};