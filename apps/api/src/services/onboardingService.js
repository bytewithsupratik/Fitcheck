import { catalogRepository } from "../repositories/catalogRepository.js";
import { onboardingRepository } from "../repositories/onboardingRepository.js";
import { goalRepository } from "../repositories/goalRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export const onboardingService = {
  parseTimelineToDays(timeline) {
    if (typeof timeline === "number" && timeline > 0) return Math.round(timeline);
    if (!timeline) return 90; // Default 3 months

    const lower = timeline.toLowerCase().trim();
    if (lower.includes("1 week")) return 7;
    if (lower.includes("3 week")) return 21;
    if (lower.includes("1 month")) return 30;
    if (lower.includes("3 month")) return 90;
    if (lower.includes("6 month")) return 180;
    if (lower.includes("1 year")) return 365;

    const match = lower.match(/^(\d+)\s*(day|week|month|year)/);
    if (match) {
      const count = parseInt(match[1], 10);
      const unit = match[2];
      if (unit.startsWith("day")) return count;
      if (unit.startsWith("week")) return count * 7;
      if (unit.startsWith("month")) return count * 30;
      if (unit.startsWith("year")) return count * 365;
    }

    return 90;
  },

  async submitOnboarding(userId, payload) {
    const { preferredName, goalType, goalInput, timeline, githubUrl } = payload;

    if (!goalType || !goalInput) {
      throw new BadRequestError("goalType and goalInput are required");
    }

    // 1. Normalize Mode
    const isJob = goalType.toLowerCase().includes("job");
    const mode = isJob ? "JOB_READY" : "TOPIC_SPRINT";

    // 2. Resolve Target from Catalog
    let jobId = null;
    let topicId = null;
    let resolvedTarget = null;

    if (mode === "JOB_READY") {
      resolvedTarget = await catalogRepository.findJobByNameOrId(goalInput);
      if (!resolvedTarget) {
        throw new NotFoundError(`Target job '${goalInput}' not found in catalog`);
      }
      jobId = resolvedTarget.id;
    } else {
      resolvedTarget = await catalogRepository.findTopicByNameOrId(goalInput);
      if (!resolvedTarget) {
        throw new NotFoundError(`Target topic '${goalInput}' not found in catalog`);
      }
      topicId = resolvedTarget.id;
    }

    // 3. Normalize Timeline
    const durationDays = this.parseTimelineToDays(timeline);

    // 4. Sanitize GitHub Slug
    let githubSlug = null;
    if (githubUrl) {
      const cleaned = githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "");
      if (cleaned.includes("/")) githubSlug = cleaned;
    }

    // 5. Upsert Onboarding
    const onboarding = await onboardingRepository.upsertOnboarding({
      userId,
      topicId,
      jobId,
      mode,
      durationDays,
    });

    // 6. Manage Active Goal (Cancel existing active goals, then create new)
    await goalRepository.cancelActiveGoals(userId);
    const goal = await goalRepository.createActiveGoal({
      learnerId: userId,
      topicId,
      jobId,
      goalType: mode,
    });

    // 7. Update User Profile
    await userRepository.updateProfile(userId, {
      preferred_name: preferredName || null,
      target_role: mode === "JOB_READY" ? resolvedTarget.name : null,
      focus_topic: mode === "TOPIC_SPRINT" ? resolvedTarget.name : null,
      timeline: timeline ? String(timeline) : `${durationDays} Days`,
      github_slug: githubSlug,
    });

    return {
      onboardingId: onboarding.id,
      goalId: goal.id,
      mode,
      durationDays,
      target: resolvedTarget.name,
    };
    
  },
};
