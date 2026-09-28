import { intelligenceClient } from "../clients/intelligenceClient.js";
import { upeService } from "./upeService.js";
import crypto from "crypto";

export const adeService = {
  // 1. Ingest UPE Signal into ADE (UPE -> ADE Workflow)
  async triggerAdaptation(userId, context) {
    // Fetch current progress & ADE signal from UPE
    const progressData = await upeService.getCurrentProgress(userId, context);
    const upeEval = progressData.data || progressData;
    const adeSignal = upeEval.ade_signal || {
      overall_progress: upeEval.overall_progress || 0.63,
      depth: upeEval.depth || 0.44,
      velocity: upeEval.velocity || 0.48,
      consistency: upeEval.consistency || 0.75,
      alignment: upeEval.alignment || 0.97,
      overall_trend: upeEval.trend?.overall || "IMPROVING",
      velocity_trend: upeEval.trend?.velocity || "ACCELERATING",
    };

    const correlationId = context?.correlationId || `CORR-${crypto.randomUUID()}`;

    // Build Schema-Compliant EvaluateEventRequest
    const evaluateRequest = {
      event: {
        event_id: `EVT-UPE-${crypto.randomUUID().slice(0, 8)}`,
        event_type: "PROGRESS_EVALUATED",
        schema_version: "1.0",
        producer: "UPE",
        learner_id: String(userId),
        occurred_at: new Date().toISOString(),
        correlation_id: correlationId,
        causation_id: upeEval.evaluation_id || null,
        data: adeSignal,
      },
      cig_state: null,
    };

    // Dispatch to Python ADE
    return intelligenceClient.adeIngestEvent(evaluateRequest, context);
  },

  // 2. Get Decision by ID
  async getDecision(decisionId, context) {
    return intelligenceClient.adeGetDecision(decisionId, context);
  },

  // 3. Get Active Decision for Learner
  async getCurrentDecision(userId, context) {
    return intelligenceClient.adeGetCurrentDecision(userId, context);
  },

  // 4. Get Decision History for Learner
  async getHistory(userId, context) {
    return intelligenceClient.adeGetLearnerDecisions(userId, context);
  },

  // 5. Approve Decision (Governance Path)
  async approveDecision(decisionId, context) {
    return intelligenceClient.adeApproveDecision(decisionId, context);
  },

  // 6. Reject Decision (Governance Path)
  async rejectDecision(decisionId, reason, context) {
    return intelligenceClient.adeRejectDecision(decisionId, reason, context);
  },
};