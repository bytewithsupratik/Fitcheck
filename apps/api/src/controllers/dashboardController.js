import { dashboardService } from "../services/dashboardService.js";

export const dashboardController = {
  async getMetrics(req, res, next) {
    try {
      const data = await dashboardService.getMetrics(req.user.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getEvidence(req, res, next) {
    try {
      const data = await dashboardService.getEvidenceRecords(req.user.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};