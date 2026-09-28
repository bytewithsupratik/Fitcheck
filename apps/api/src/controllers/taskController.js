import { progressionService } from "../services/progressionService.js";

export const taskController = {
  async complete(req, res, next) {
    try {
      const result = await progressionService.completeTask(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};