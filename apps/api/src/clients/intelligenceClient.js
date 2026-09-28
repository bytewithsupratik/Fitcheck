import axios from "axios";
import { env } from "../config/env.js";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
  AppError,
} from "../utils/errors.js";

export class IntelligenceServiceError extends AppError {
  constructor(message = "Intelligence service unavailable", statusCode = 503, details = {}) {
    super(message, statusCode, "INTELLIGENCE_SERVICE_ERROR", details);
  }
}

const httpClient = axios.create({
  baseURL: env.INTELLIGENCE_SERVICE_URL,
  timeout: env.INTELLIGENCE_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const intelligenceClient = {
  async request({ method, url, data, params, requestId, correlationId }) {
    try {
      const headers = {};
      if (requestId) headers["X-Request-Id"] = requestId;
      if (correlationId) headers["X-Correlation-Id"] = correlationId;

      const response = await httpClient({
        method,
        url,
        data,
        params,
        headers,
      });

      return response.data;
    } catch (error) {
      this.handleAxiosError(error, requestId);
    }
  },

  handleAxiosError(error, requestId) {
    if (error.code === "ECONNREFUSED") {
      throw new IntelligenceServiceError(
        `Intelligence service is offline or unreachable at ${env.INTELLIGENCE_SERVICE_URL}`,
        503,
        { code: "ECONNREFUSED", requestId }
      );
    }

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new IntelligenceServiceError(
        `Intelligence service timed out after ${env.INTELLIGENCE_TIMEOUT_MS}ms`,
        504,
        { code: "GATEWAY_TIMEOUT", requestId }
      );
    }

    if (!error.response) {
      throw new IntelligenceServiceError(error.message, 500, { requestId });
    }

    const { status, data } = error.response;
    const errorDetail = data?.detail || {};
    const message =
      typeof errorDetail === "string"
        ? errorDetail
        : errorDetail?.message || "Intelligence engine validation error";
    const details = typeof errorDetail === "object" ? errorDetail : { raw: data };

    switch (status) {
      case 400:
        throw new BadRequestError(message, details);
      case 404:
        throw new NotFoundError(message, details);
      case 422:
        throw new ValidationError("Intelligence payload validation failed", details);
      default:
        throw new IntelligenceServiceError(message, status >= 500 ? status : 502, details);
    }
  },

  // -------------------------------------------------------------
  // CIE (Career Intelligence Engine) API Contracts (All 4 Routes)
  // -------------------------------------------------------------

  // 1. GET: List Canonical Targets (supports optional ?target_type=CAREER|DOMAIN)
  async cieListTargets(params = {}, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: "/api/v1/cie/targets",
      params,
      requestId,
      correlationId,
    });
  },

  // 2. GET: Target Profile by ID
  async cieGetTargetProfile(targetId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/cie/targets/${targetId}`,
      requestId,
      correlationId,
    });
  },

  // 3. GET: Target Roadmap by ID
  async cieGetTargetRoadmap(targetId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/cie/targets/${targetId}/roadmap`,
      requestId,
      correlationId,
    });
  },

  // 4. POST: Primary CIE Evaluation
  async cieEvaluate(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/cie/evaluate",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // -------------------------------------------------------------
  // EIE (Evidence Intelligence Engine) API Contracts (All 4 Modalities)
  // -------------------------------------------------------------

  // 1. POST: Evaluate GitHub Repository
  async eieEvaluateGithub(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/evidence/evaluate/github",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 2. POST: Evaluate Technical Report (Markdown / PDF Pages)
  async eieEvaluateReport(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/evidence/evaluate/report",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 3. POST: Evaluate Assessment Exam / Quiz
  async eieEvaluateAssessment(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/evidence/evaluate/assessment",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 4. POST: Evaluate Pre-extracted Raw Observations
  async eieEvaluateRaw(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/evidence/evaluate",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 5. GET: EIE Health Check Probe
  async eieHealth({ requestId } = {}) {
    return this.request({
      method: "GET",
      url: "/health",
      requestId,
    });
  },

  // -------------------------------------------------------------
  // RIE (Readiness Intelligence Engine)
  // -------------------------------------------------------------
  async rieEvaluateReadiness(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/readiness/evaluate",
      data: payload,
      requestId,
      correlationId,
    });
  },

  async rieGetCurrentReadiness(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/readiness/${learnerId}/current`,
      requestId,
      correlationId,
    });
  },

  async rieGetMIEHandoff(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/readiness/handoff/mie",
      data: payload,
      requestId,
      correlationId,
    });
  },

 // -------------------------------------------------------------
  // MIE (Mission Intelligence Engine) API Contracts (All 10 Routes)
  // -------------------------------------------------------------

  // 1. POST: Generate Learning Experience
  async mieGenerateExperience(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/learning-experiences",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 2. GET: Experience by ID
  async mieGetExperienceById(experienceId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/learning-experiences/${experienceId}`,
      requestId,
      correlationId,
    });
  },

  // 3. GET: Current Active Experience for Learner
  async mieGetCurrentExperience(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/learners/${learnerId}/learning-experiences/current`,
      requestId,
      correlationId,
    });
  },

  // 4. GET: Curated Resources for Experience
  async mieGetResources(experienceId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/learning-experiences/${experienceId}/resources`,
      requestId,
      correlationId,
    });
  },

  // 5. GET: Coding Project Specification
  async mieGetProject(experienceId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/learning-experiences/${experienceId}/project`,
      requestId,
      correlationId,
    });
  },

  // 6. POST: Submit Coding Project via GitHub URL
  async mieSubmitProject(projectId, githubUrl, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/projects/${projectId}/submission`,
      data: { github_url: githubUrl },
      requestId,
      correlationId,
    });
  },

  // 7. GET: Aligned Assessment for Experience
  async mieGetAssessment(experienceId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/learning-experiences/${experienceId}/assessment`,
      requestId,
      correlationId,
    });
  },

  // 8. POST: Start Assessment Attempt
  async mieStartAssessmentAttempt(assessmentId, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/assessments/${assessmentId}/attempts`,
      requestId,
      correlationId,
    });
  },

  // 9. POST: Submit Assessment Answers
  async mieSubmitAssessment(assessmentId, learnerAnswers, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/assessments/${assessmentId}/submit`,
      data: { learner_answers: learnerAnswers },
      requestId,
      correlationId,
    });
  },

  // 10. POST: Complete Learning Step
  async mieCompleteStep(experienceId, stepId, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/learning-experiences/${experienceId}/steps/${stepId}/complete`,
      requestId,
      correlationId,
    });
  },

  // -------------------------------------------------------------
  // UPE (Universal Progress Engine)
  // -------------------------------------------------------------
  async upeEvaluateProgress(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/progress/evaluate",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // -------------------------------------------------------------
  // ADE (Adaptive Decision Engine)
  // -------------------------------------------------------------
  async adeSendEvent(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/ade/events",
      data: payload,
      requestId,
      correlationId,
    });
  },

  async adeApproveDecision(decisionId, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/ade/decisions/${decisionId}/approve`,
      requestId,
      correlationId,
    });
  },

  async adeRejectDecision(decisionId, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/ade/decisions/${decisionId}/reject`,
      requestId,
      correlationId,
    });
  },

  // -------------------------------------------------------------
  // UPE (Universal Progress Engine) API Contracts (All 5 Routes)
  // -------------------------------------------------------------

  // 1. POST: Evaluate Progress
  async upeEvaluateProgress(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/progress/evaluate",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 2. GET: Current Progress
  async upeGetCurrentProgress(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/progress/${learnerId}/current`,
      requestId,
      correlationId,
    });
  },

  // 3. GET: Progress History Timeline
  async upeGetProgressHistory(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/progress/${learnerId}/history`,
      requestId,
      correlationId,
    });
  },

  // 4. GET: Capability Progress Breakdown
  async upeGetCapabilitiesProgress(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/progress/${learnerId}/capabilities`,
      requestId,
      correlationId,
    });
  },

  // 5. GET: Trend Summary
  async upeGetProgressTrend(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/progress/${learnerId}/trend`,
      requestId,
      correlationId,
    });
  },

  // -------------------------------------------------------------
  // ADE (Adaptive Decision Engine) API Contracts (All 7 Routes)
  // -------------------------------------------------------------

  // 1. POST: Ingest Event & Trigger Governance
  async adeIngestEvent(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/ade/events",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 2. POST: Direct Evaluation
  async adeEvaluate(payload, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: "/api/v1/ade/evaluate",
      data: payload,
      requestId,
      correlationId,
    });
  },

  // 3. GET: Decision by ID
  async adeGetDecision(decisionId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/ade/decisions/${decisionId}`,
      requestId,
      correlationId,
    });
  },

  // 4. GET: Learner Decision History
  async adeGetLearnerDecisions(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/ade/learners/${learnerId}/decisions`,
      requestId,
      correlationId,
    });
  },

  // 5. GET: Current Active Decision
  async adeGetCurrentDecision(learnerId, { requestId, correlationId } = {}) {
    return this.request({
      method: "GET",
      url: `/api/v1/ade/learners/${learnerId}/decisions/current`,
      requestId,
      correlationId,
    });
  },

  // 6. POST: Approve Pending Decision
  async adeApproveDecision(decisionId, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/ade/decisions/${decisionId}/approve`,
      requestId,
      correlationId,
    });
  },

  // 7. POST: Reject Pending Decision
  async adeRejectDecision(decisionId, reason, { requestId, correlationId } = {}) {
    return this.request({
      method: "POST",
      url: `/api/v1/ade/decisions/${decisionId}/reject`,
      data: { reason: reason || "User declined recommended trajectory change" },
      requestId,
      correlationId,
    });
  },
};