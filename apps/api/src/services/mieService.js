import { intelligenceClient } from "../clients/intelligenceClient.js";
import { cieService } from "./cieService.js";
import { rieService } from "./rieService.js";
import { userRepository } from "../repositories/userRepository.js";
import { supabase } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

export const mieService = {
  async generateExperience(userId, context) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const { data: activeGoal } = await supabase
      .from("learner_goals")
      .select("*, job:jobs(name), topic:topics(name)")
      .eq("learner_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!activeGoal) throw new NotFoundError("No active career goal found.");

    // 1. Fetch live CIE Requirements dynamically
    const cieResult = await cieService.evaluateCurrentTarget(userId, context);
    const cieEval = cieResult.evaluation;

    // 2. Fetch live RIE Handoff dynamically
    const rieHandoffData = await rieService.generateMIEHandoff(userId, context);
    const priorityGaps = rieHandoffData.mission_candidates || rieHandoffData.data?.mission_candidates || [];

    // 3. Extract dynamically generated learning requirements from CIE
    const learningRequirements = (cieEval.requirements?.learning || []).map((lr, idx) => ({
      requirement_id: lr.requirement_id || `LR-${idx + 1}`,
      capability_id: lr.capability_id || (priorityGaps[idx]?.capability_id || "CAP-CORE"),
      topic: lr.topic || `${cieResult.targetRole} Fundamentals`,
      priority: lr.priority || "HIGH",
      prerequisite_ids: lr.prerequisite_ids || [],
      expected_outcome: lr.expected_outcome || `Demonstrate verified proficiency in ${cieResult.targetRole}`,
    }));

    // 4. Assemble dynamic MIEInput payload
    const miePayload = {
      learner_context: {
        learner_id: String(userId),
        goal_id: String(activeGoal.id),
        target_id: cieResult.cieTargetId,
        current_state_version: "1.0",
      },
      cie_requirements: {
        cie_version: "1.0",
        capability_requirements: (cieEval.capability_alignment?.required || []).map((req) => ({
          capability_id: req.capability_id,
          importance: req.importance || "CORE",
          expected_proficiency: req.expected_proficiency || "PROFICIENT",
          requirement_type: req.requirement_type || "TECHNICAL",
        })),
        learning_requirements: learningRequirements,
        experience_requirements: cieEval.requirements?.experience || [],
        evidence_expectations: cieEval.requirements?.evidence || [],
      },
      rie_handoff: {
        readiness_evaluation_id: rieHandoffData.rie_evaluation_id || "RIE-ACTIVE",
        source_state_version: "1.0",
        priority_gaps: priorityGaps,
      },
      cig_context: {
        capability_states: (cieEval.capability_alignment?.supporting || []).map((cap) => ({
          capability_id: cap.capability_id,
          proficiency: cap.current_proficiency || "FOUNDATIONAL",
          confidence: cap.confidence || 0.8,
        })),
        learning_history: [],
        previous_experiences: [],
        previous_assessments: [],
      },
    };

    return intelligenceClient.mieGenerateExperience(miePayload, context);
  },

  async getExperienceById(experienceId, context) {
    return intelligenceClient.mieGetExperienceById(experienceId, context);
  },

  async getCurrentExperience(userId, context) {
    try {
      const currentExperience = await intelligenceClient.mieGetCurrentExperience(userId, context);
      const cieResult = await cieService.evaluateCurrentTarget(userId, context);
      const expectedTargetId = cieResult.cieTargetId;

      if (currentExperience?.target_id && currentExperience.target_id !== expectedTargetId) {
        console.log(
          `[MIE Service] Target mismatch detected: Cached '${currentExperience.target_id}' != Expected '${expectedTargetId}'. Auto-regenerating...`
        );
        return await this.generateExperience(userId, context);
      }

      return currentExperience;
    } catch (error) {
      if (error.statusCode === 404) {
        return this.generateExperience(userId, context);
      }
      throw error;
    }
  },

  async getResources(experienceId, context) {
    return intelligenceClient.mieGetResources(experienceId, context);
  },

  async getProject(experienceId, context) {
    return intelligenceClient.mieGetProject(experienceId, context);
  },

  async submitProject(projectId, githubUrl, context) {
    return intelligenceClient.mieSubmitProject(projectId, githubUrl, context);
  },

  async getAssessment(experienceId, context) {
    return intelligenceClient.mieGetAssessment(experienceId, context);
  },

  async startAssessmentAttempt(assessmentId, context) {
    return intelligenceClient.mieStartAssessmentAttempt(assessmentId, context);
  },

  async submitAssessment(assessmentId, learnerAnswers, context) {
    return intelligenceClient.mieSubmitAssessment(assessmentId, learnerAnswers, context);
  },

  async completeStep(experienceId, stepId, context) {
    return intelligenceClient.mieCompleteStep(experienceId, stepId, context);
  },
};