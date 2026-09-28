import { userService } from "../services/userService.js";

export const userController = {
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user.id);
      res.status(200).json({
        profile,
      });
    } catch (error) {
      next(error);
    }
  },
};