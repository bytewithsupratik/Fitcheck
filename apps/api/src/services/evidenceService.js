import { intelligenceClient } from "../clients/intelligenceClient.js";
import { evidenceRepository } from "../repositories/evidenceRepository.js";
import { BadRequestError } from "../utils/errors.js";

// Shared helper to extract and persist observations & claims from any EIE audit chain
async function persistEieAuditChain(userId, evidenceId, auditChain) {
  if (!auditChain || auditChain.length === 0) return { obsCount: 0, claimsCount: 0 };

  const observationsMap = new Map();
  const claimsMap = new Map();

  for (const item of auditChain) {
    // 1. Extract Observations
    if (item.observation_id && !observationsMap.has(item.observation_id)) {
      const factDesc = typeof item.observed_fact === "object"
        ? JSON.stringify(item.observed_fact)
        : String(item.observed_fact || "Detected");

      observationsMap.set(item.observation_id, {
        learner_id: userId,
        evidence_id: evidenceId,
        observation_type: item.source_location || "EVIDENCE_SIGNAL",
        description: `${item.observation_id}: ${factDesc}`,
      });
    }

    // 2. Extract Claims
    if (item.claim_id && !claimsMap.has(item.claim_id)) {
      claimsMap.set(item.claim_id, {
        learner_id: userId,
        claim_type: "CAPABILITY_CLAIM",
        statement: item.statement || `Demonstrated capability ${item.capability_id}`,
        confidence: 0.88,
        status: "ACTIVE",
      });
    }
  }

  const observationsToSave = Array.from(observationsMap.values());
  if (observationsToSave.length > 0) {
    await evidenceRepository.saveObservations(observationsToSave);
  }

  const claimsToSave = Array.from(claimsMap.values());
  if (claimsToSave.length > 0) {
    await evidenceRepository.saveClaims(claimsToSave);
  }

  return {
    obsCount: observationsToSave.length,
    claimsCount: claimsToSave.length,
  };
}

export const evidenceService = {
  // 1. GitHub Repository Evaluation
  async submitGithubEvidence(userId, { repoUrl, title, description }, context) {
    if (!repoUrl) throw new BadRequestError("repoUrl is required");

    const isGithub = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/.test(repoUrl);
    if (!isGithub) throw new BadRequestError("Invalid GitHub repository URL format");

    const evidence = await evidenceRepository.createPendingEvidence({
      learnerId: userId,
      title: title || `GitHub Repo: ${repoUrl.split("/").slice(-2).join("/")}`,
      description: description || "Public GitHub repository submitted for EIE capability evaluation",
      evidenceType: "GITHUB_REPO",
      sourceUrl: repoUrl,
    });

    try {
      const eieResult = await intelligenceClient.eieEvaluateGithub({
        evidence_id: String(evidence.id),
        user_id: String(userId),
        repo_url: repoUrl,
        allowed_capabilities: null,
      }, context);

      const auditChain = eieResult.event?.data?.provenance?.audit_chain || [];
      const { obsCount, claimsCount } = await persistEieAuditChain(userId, evidence.id, auditChain);

      await evidenceRepository.updateEvidenceStatus(evidence.id, "EVALUATED");

      return {
        evidenceId: evidence.id,
        status: "EVALUATED",
        evidenceType: "GITHUB_REPO",
        savedObservations: obsCount,
        savedClaims: claimsCount,
        eieResult,
      };
    } catch (error) {
      await evidenceRepository.updateEvidenceStatus(evidence.id, "FAILED");
      throw error;
    }
  },

  // 2. Technical Report Evaluation (PDF / Markdown)
  async submitReportEvidence(userId, { title, reportText, pages }, context) {
    if (!reportText && (!pages || pages.length === 0)) {
      throw new BadRequestError("reportText or pages array is required");
    }

    const evidence = await evidenceRepository.createPendingEvidence({
      learnerId: userId,
      title: title || "Technical Project Report",
      description: "Technical report document submitted for EIE capability evaluation",
      evidenceType: "PROJECT_REPORT",
      sourceUrl: null,
    });

    try {
      const eieResult = await intelligenceClient.eieEvaluateReport({
        evidence_id: String(evidence.id),
        user_id: String(userId),
        title: title || "Technical Project Report",
        report_text: reportText || "",
        pages: pages || null,
        allowed_capabilities: null,
      }, context);

      const auditChain = eieResult.event?.data?.provenance?.audit_chain || [];
      const { obsCount, claimsCount } = await persistEieAuditChain(userId, evidence.id, auditChain);

      await evidenceRepository.updateEvidenceStatus(evidence.id, "EVALUATED");

      return {
        evidenceId: evidence.id,
        status: "EVALUATED",
        evidenceType: "PROJECT_REPORT",
        savedObservations: obsCount,
        savedClaims: claimsCount,
        eieResult,
      };
    } catch (error) {
      await evidenceRepository.updateEvidenceStatus(evidence.id, "FAILED");
      throw error;
    }
  },

  // 3. Question-Level Assessment Evaluation
  async submitAssessmentEvidence(userId, { assessmentId, title, questions }, context) {
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestError("questions array is required with question_id and score details");
    }

    const evidence = await evidenceRepository.createPendingEvidence({
      learnerId: userId,
      title: title || `Assessment: ${assessmentId || "Exam"}`,
      description: "Question-level assessment submission evaluated by EIE",
      evidenceType: "ASSESSMENT_RESULT",
      sourceUrl: null,
    });

    try {
      const eieResult = await intelligenceClient.eieEvaluateAssessment({
        evidence_id: String(evidence.id),
        user_id: String(userId),
        assessment_id: assessmentId || `ASM_${Date.now()}`,
        title: title || "Assessment Evaluation",
        questions,
        allowed_capabilities: null,
      }, context);

      const auditChain = eieResult.event?.data?.provenance?.audit_chain || [];
      const { obsCount, claimsCount } = await persistEieAuditChain(userId, evidence.id, auditChain);

      await evidenceRepository.updateEvidenceStatus(evidence.id, "EVALUATED");

      return {
        evidenceId: evidence.id,
        status: "EVALUATED",
        evidenceType: "ASSESSMENT_RESULT",
        savedObservations: obsCount,
        savedClaims: claimsCount,
        eieResult,
      };
    } catch (error) {
      await evidenceRepository.updateEvidenceStatus(evidence.id, "FAILED");
      throw error;
    }
  },

  // 4. Raw Pre-extracted Observations Evaluation
  async submitRawEvidence(userId, { observations, allowedCapabilities }, context) {
    if (!observations || observations.length === 0) {
      throw new BadRequestError("observations array is required");
    }

    const evidence = await evidenceRepository.createPendingEvidence({
      learnerId: userId,
      title: "Raw Observation Evaluation",
      description: "Pre-extracted observations submitted directly for capability synthesis",
      evidenceType: "RAW_OBSERVATIONS",
      sourceUrl: null,
    });

    try {
      const eieResult = await intelligenceClient.eieEvaluateRaw({
        evidence_id: String(evidence.id),
        observations: observations.map((obs, idx) => ({
          observation_id: obs.observation_id || `OBS_${idx + 1}`,
          evidence_id: String(evidence.id),
          category: obs.category || "REPOSITORY_METADATA",
          name: obs.name || "metric",
          value: String(obs.value || "detected"),
          source_location: obs.source_location || "raw",
          verified: obs.verified ?? true,
        })),
        allowed_capabilities: allowedCapabilities || [],
      }, context);

      // Raw endpoint returns evaluation.claims directly
      const rawClaims = eieResult.evaluation?.claims || [];
      if (rawClaims.length > 0) {
        const claimsToSave = rawClaims.map((claim) => ({
          learner_id: userId,
          claim_type: "CAPABILITY_CLAIM",
          statement: claim.statement,
          confidence: claim.confidence || 0.88,
          status: "ACTIVE",
        }));
        await evidenceRepository.saveClaims(claimsToSave);
      }

      await evidenceRepository.updateEvidenceStatus(evidence.id, "EVALUATED");

      return {
        evidenceId: evidence.id,
        status: "EVALUATED",
        evidenceType: "RAW_OBSERVATIONS",
        savedClaims: rawClaims.length,
        eieResult,
      };
    } catch (error) {
      await evidenceRepository.updateEvidenceStatus(evidence.id, "FAILED");
      throw error;
    }
  },

  // 5. Probe EIE Health
  async getHealth(context) {
    return intelligenceClient.eieHealth(context);
  },
};