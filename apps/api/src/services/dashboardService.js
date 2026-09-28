import { dashboardRepository } from "../repositories/dashboardRepository.js";

export const dashboardService = {
  async getMetrics(userId) {
    const { user, completedMissionsCount } = await dashboardRepository.getUserMetrics(userId);

    const streakDays = user.streak_days || 0;
    const readinessPct = Math.round(user.readiness_pct || 25);
    const goalPct = Math.round(user.goal_pct || 85);

    return {
      // Legacy frontend presentation strings
      readiness: `${readinessPct}%`,
      streak: `${streakDays} Day${streakDays === 1 ? "" : "s"}`,
      goal: `${goalPct}%`,
      velocity: completedMissionsCount > 0 ? `${completedMissionsCount} completed` : "Standard",

      // Authoritative numeric primitives
      metrics: {
        readinessPct,
        streakDays,
        goalPct,
        dayNumber: user.day_number || 1,
        target: user.target_role || user.focus_topic,
        completedMissions: completedMissionsCount,
      },
    };
  },

  async getEvidenceRecords(userId) {
    const records = await dashboardRepository.getUserEvidence(userId);
    return {
      evidence: records.map((rec) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        type: rec.evidence_type,
        source: rec.source,
        url: rec.source_url,
        status: rec.status,
        submittedAt: rec.submitted_at,
        observationsCount: rec.observations ? rec.observations.length : 0,
      })),
    };
  },
};