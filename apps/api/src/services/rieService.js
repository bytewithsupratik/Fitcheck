import { intelligenceClient } from "../clients/intelligenceClient.js";
import { cieService } from "./cieService.js";
import { userRepository } from "../repositories/userRepository.js";
import { supabase } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

export const rieService = {
  // Shared helper that builds the unified RIE input payload
  async buildRiePayload(userId, context) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const { data: activeGoal } = await supabase
      .from("learner_goals")
      .select("*, job:jobs(id, name), topic:topics(id, name)")
      .eq("learner_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!activeGoal) {
      throw new NotFoundError("No active career goal found. Complete onboarding first.");
    }

    // 1. Fetch CIE Requirements
    const cieResult = await cieService.evaluateCurrentTarget(userId, context);
    const cieEval = cieResult.evaluation;

    // 2. Assemble Demonstrated Capabilities
    const learnerCapabilities = [
      {
        capability_id: "CAP-JAVASCRIPT",
        proficiency: "PROFICIENT",
        mastery: "DEMONSTRATED",
        confidence: 0.85,
        evidence_strength: "STRONG",
      },
      {
        capability_id: "CAP-TESTING",
        proficiency: "PROFICIENT",
        mastery: "DEMONSTRATED",
        confidence: 0.85,
        evidence_strength: "STRONG",
      },
      {
        capability_id: "CAP-TYPESCRIPT",
        proficiency: "FOUNDATIONAL",
        mastery: "NOT_DEMONSTRATED",
        confidence: 0.3,
        evidence_strength: "WEAK",
      },
    ];

    // 3. Assemble Schema
    return {
      user,
      targetId: cieResult.cieTargetId,
      payload: {
        learner_state: {
          learner_id: String(userId),
          state_version: "1.0",
          capabilities: learnerCapabilities,
          experience_state: {
            project_experience: "SATISFIED",
          },
          consistency: 0.9,
          goal_id: String(activeGoal.id),
          active_target_id: cieResult.cieTargetId,
        },
        cie_requirements: {
          cie_evaluation_id: cieEval.cie_evaluation_id || "CIE_7467b47a",
          cie_version: "CIE-1.0",
          target_id: cieResult.cieTargetId,
          capability_requirements: (cieEval.capability_alignment?.required || []).map((req) => ({
            capability_id: req.capability_id,
            importance: req.importance || "CORE",
            expected_proficiency: req.expected_proficiency || "PROFICIENT",
            requirement_type: "TECHNICAL",
          })),
          experience_requirements: (cieEval.requirements?.experience || []).map((exp) => ({
            requirement_id: exp.requirement_id || "REQ_EXP_1",
            category: exp.category || "PROJECT",
            description: exp.description || "Fullstack web project",
            specificity: "GENERIC",
            capability_ids: exp.capability_ids || ["CAP-NEXTJS"],
          })),
          evidence_expectations: (cieEval.requirements?.evidence || []).map((ev) => ({
            expectation_id: ev.expectation_id || "EXP_EV_1",
            requirement_id: ev.requirement_id || "REQ_EXP_1",
            evidence_type: ev.evidence_type || "GITHUB_PROJECT",
            minimum_strength: "WEAK",
          })),
        },
        previous_evaluation: null,
      },
    };
  },

  // 1. POST /readiness/evaluate: Calculate Readiness
  async evaluateReadiness(userId, context) {
    const { user, targetId, payload } = await this.buildRiePayload(userId, context);

    const rieResult = await intelligenceClient.rieEvaluateReadiness(payload, context);

    const rawOverall = rieResult.readiness?.overall ?? 0.3;
    const readinessPct = Math.min(100, Math.max(0, Math.round(rawOverall * 100)));

    await userRepository.updateProfile(userId, {
      readiness_pct: readinessPct,
    });

    return {
      learnerId: userId,
      targetId,
      calculatedReadinessPct: `${readinessPct}%`,
      rieEvaluation: rieResult,
    };
  },

  // 2. GET /readiness/current: Read Current State
  async getCurrentReadiness(userId, context) {
    try {
      return await intelligenceClient.rieGetCurrentReadiness(userId, context);
    } catch (error) {
      if (error.statusCode === 404) {
        return this.evaluateReadiness(userId, context);
      }
      throw error;
    }
  },

  // 3. GET /readiness/history: Read History Timeline
  async getReadinessHistory(userId, context) {
    return intelligenceClient.request({
      method: "GET",
      url: `/api/v1/readiness/${userId}/history`,
      requestId: context?.requestId,
      correlationId: context?.correlationId,
    });
  },

  // 4. POST /readiness/handoff/mie: Transfer Prioritized Gaps to MIE
  async generateMIEHandoff(userId, context) {
    const { payload } = await this.buildRiePayload(userId, context);

    return intelligenceClient.request({
      method: "POST",
      url: "/api/v1/readiness/handoff/mie",
      data: payload,
      requestId: context?.requestId,
      correlationId: context?.correlationId,
    });
  },
};