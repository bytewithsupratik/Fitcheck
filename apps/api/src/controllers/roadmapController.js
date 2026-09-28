import { roadmapService } from "../services/roadmapService.js";

export const roadmapController = {
  async getTrack(req, res, next) {
    try {
      const result = await roadmapService.getTrack(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};