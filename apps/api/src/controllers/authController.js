import { authService } from "../services/authService.js";

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, username } = req.body;
      const user = await authService.register({ email, password, username });
      res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    res.status(200).json({
      message: "Logged out successfully",
    });
  },
};