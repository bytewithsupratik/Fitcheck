import { onboardingService } from "../services/onboardingService.js";

export const onboardingController = {
  async submit(req, res, next) {
    try {
      const result = await onboardingService.submitOnboarding(req.user.id, req.body);
      res.status(200).json({
        message: "Onboarding submitted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};