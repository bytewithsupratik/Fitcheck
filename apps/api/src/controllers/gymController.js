import { gymService } from "../services/gymService.js";
import { BadRequestError } from "../utils/errors.js";

export const gymController = {
  async getChallenges(req, res, next) {
    try {
      const data = await gymService.getChallenges(req.user.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async verifyRepo(req, res, next) {
    try {
      const { repoUrl, sprintChallengeId } = req.body;
      if (!repoUrl) throw new BadRequestError("repoUrl is required");

      const result = await gymService.verifyRepository(
        req.user.id,
        { repoUrl, sprintChallengeId },
        {
          requestId: req.requestId,
          correlationId: req.headers["x-correlation-id"],
        }
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async submitCode(req, res, next) {
    try {
      const { challengeId, code, language } = req.body;
      const result = await gymService.submitCode(req.user.id, { challengeId, code, language });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};