import { roadmapRepository } from "../repositories/roadmapRepository.js";
import { goalRepository } from "../repositories/goalRepository.js";
import { supabase } from "../db/client.js";

export const roadmapService = {
  async getTrack(userId) {
    // 1. Fetch active roadmap
    let roadmap = await roadmapRepository.findActiveRoadmap(userId);

    // 2. If absent, provision baseline roadmap bound to user's active job
    if (!roadmap) {
      const { data: onboarding, error: onboardingError } = await supabase
        .from("onboarding")
        .select("duration_days, topic:topics(name), job:jobs(name)")
        .eq("user_id", userId)
        .maybeSingle();

      if (onboardingError) throw onboardingError;

      const { data: activeGoal, error: goalError } = await supabase
        .from("learner_goals")
        .select("job_id")
        .eq("learner_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (goalError) throw goalError;

      const targetTitle = onboarding?.topic?.name || onboarding?.job?.name || "Curriculum";
      const totalDays = onboarding?.duration_days || 90;

      roadmap = await roadmapRepository.createBaselineRoadmap(
        userId,
        activeGoal?.job_id || null,
        targetTitle,
        totalDays
      );
    }

    // 3. Serialize into frontend "days" format for backwards compatibility
    const days = [];
    let dayIndex = 1;

    // Sort stages
    const sortedStages = (roadmap.stages || []).sort((a, b) => a.stage_order - b.stage_order);

    for (const stage of sortedStages) {
      const sortedMissions = (stage.missions || []).sort((a, b) => a.mission_order - b.mission_order);

      for (const mission of sortedMissions) {
        const sortedTasks = (mission.tasks || []).sort((a, b) => a.task_order - b.task_order);

        for (const task of sortedTasks) {
          days.push({
            id: task.id,
            dayNumber: dayIndex++,
            title: task.title,
            episode: stage.stage_order,
            episodeTitle: stage.title,
            status: task.status === "completed" ? "completed" : task.status === "in_progress" ? "current" : "locked",
            stars: task.status === "completed" ? 3 : 0,
            duration: "30-45 mins",
            category: mission.title,
            nodeType: "active",
            description: task.description,
            deliverable: "Code commit or test suite pass",
            missionId: mission.id,
            stageId: stage.id,
          });
        }
      }
    }

    return {
      roadmapId: roadmap.id,
      status: roadmap.status,
      stages: sortedStages,
      days, // Legacy frontend format
    };
  },
};