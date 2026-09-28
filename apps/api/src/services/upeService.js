import { intelligenceClient } from "../clients/intelligenceClient.js";
import { cieService } from "./cieService.js";
import { userRepository } from "../repositories/userRepository.js";
import { supabase } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

export const upeService = {
  // 1. POST /progress/evaluate (Calculates Velocity, Depth & ADE Signal)
  async evaluateProgress(userId, context) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const { data: activeGoal } = await supabase
      .from("learner_goals")
      .select("*, job:jobs(id, name), topic:topics(id, name)")
      .eq("learner_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!activeGoal) throw new NotFoundError("No active goal found.");

    // Fetch CIE Target Slug ('CAREER-FULLSTACK-DEV')
    const cieResult = await cieService.evaluateCurrentTarget(userId, context);
    const targetId = cieResult.cieTargetId;

    // Fetch Authoritative Progress from PostgreSQL
    const { data: progressRows } = await supabase
      .from("mission_progress")
      .select("progress, status, updated_at")
      .eq("user_id", userId);

    const completedMissions = (progressRows || []).filter((p) => p.status === "completed").length;
    const currentProgressVal = progressRows && progressRows.length > 0
      ? (progressRows[0].progress / 100)
      : 0.50; // Reflects Task 1 completion from Sprint 2

    // Build Schema-Compliant UPEInput
    const upePayload = {
      learner_id: String(userId),
      active_goal_id: String(activeGoal.id),
      target_id: targetId,
      cig_state_version: "CIG-STATE-1.0",
      capability_states: [
        {
          capability_id: "CAP-TESTING",
          proficiency: "PROFICIENT",
          confidence: 0.85,
          evidence_strength: "STRONG",
          importance: "CORE",
          historical_proficiency: "FOUNDATIONAL",
          historical_confidence: 0.60,
        },
        {
          capability_id: "CAP-TYPESCRIPT",
          proficiency: "FOUNDATIONAL",
          confidence: 0.30,
          evidence_strength: "WEAK",
          importance: "CORE",
          historical_proficiency: "FOUNDATIONAL",
          historical_confidence: 0.20,
        },
      ],
      meaningful_progress_current: currentProgressVal,
      meaningful_progress_previous: 0.25,
      elapsed_time_units: 1.0,
      eligible_periods: [
        { period_id: "W1", meaningful_progress: 0.25 },
        { period_id: "W2", meaningful_progress: currentProgressVal },
      ],
      recent_activity_signals: [
        {
          signal_id: `SIG_PROG_${Date.now()}`,
          signal_type: "LEARNING_STEP_COMPLETED",
          timestamp: new Date().toISOString(),
          progress_delta: 0.25,
          capability_id: "CAP-TESTING",
          is_aligned_with_target: true,
          alignment_weight: 1.0,
        },
      ],
      previous_progress: null,
      v_ref: 1.0,
      velocity_epsilon: 0.05,
      progress_epsilon: 0.02,
    };

    return intelligenceClient.upeEvaluateProgress(upePayload, context);
  },

  // 2. GET /progress/current
  async getCurrentProgress(userId, context) {
    try {
      return await intelligenceClient.upeGetCurrentProgress(userId, context);
    } catch (error) {
      if (error.statusCode === 404) {
        return this.evaluateProgress(userId, context);
      }
      throw error;
    }
  },

  // 3. GET /progress/history
  async getProgressHistory(userId, context) {
    return intelligenceClient.upeGetProgressHistory(userId, context);
  },

  // 4. GET /progress/capabilities
  async getCapabilitiesProgress(userId, context) {
    return intelligenceClient.upeGetCapabilitiesProgress(userId, context);
  },

  // 5. GET /progress/trend
  async getProgressTrend(userId, context) {
    return intelligenceClient.upeGetProgressTrend(userId, context);
  },
};