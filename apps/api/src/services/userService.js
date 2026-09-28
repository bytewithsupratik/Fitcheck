import { userRepository } from "../repositories/userRepository.js";
import { learnerRepository } from "../repositories/learnerRepository.js";
import { NotFoundError } from "../utils/errors.js";

export const userService = {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User profile not found");
    }

    // Ensure learner projection exists
    const learner = await learnerRepository.ensureForUser(userId);

    // Return safe profile (no passwords or internal auth tokens)
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      targetRole: user.target_role,
      streakDays: user.streak_days,
      readinessPct: user.readiness_pct,
      learner: {
        id: learner.id,
        externalId: learner.external_id,
      },
    };
  },
};