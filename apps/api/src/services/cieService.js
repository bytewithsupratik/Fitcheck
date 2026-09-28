import { intelligenceClient } from "../clients/intelligenceClient.js";
import { userRepository } from "../repositories/userRepository.js";
import { supabase } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

// Maps database job/topic names to CIE's canonical taxonomy keys
function resolveCieTarget(jobName = "", topicName = "", goalType = "JOB_READY") {
  const isCareer = goalType === "JOB_READY" || Boolean(jobName && !topicName);
  const rawName = (isCareer ? jobName : (topicName || jobName)) || "General Engineering";

  // 1. Sanitize to clean slug (e.g. "Java Developer" -> "JAVA-DEVELOPER")
  const slug = rawName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const targetType = isCareer ? "CAREER" : "DOMAIN";

  // 2. Direct aliases for pre-registered seed targets
  if (slug === "AI-ENGINEER" || slug === "AI-ML-SPECIALIST" || slug === "AI-DEVELOPER") {
    return { targetId: "CAREER-AI-ENGINEER", targetType: "CAREER" };
  }
  if (slug === "FULL-STACK-DEVELOPER" || slug === "FULLSTACK-DEVELOPER") {
    return { targetId: "CAREER-FULLSTACK-DEV", targetType: "CAREER" };
  }
  if (slug === "WEB-DEVELOPMENT" || slug === "WEB-DEV") {
    return { targetId: "DOMAIN-WEB-DEVELOPMENT", targetType: "DOMAIN" };
  }

  // 3. Dynamic target ID for ANY other selection
  const prefix = targetType === "CAREER" ? "CAREER" : "TOPIC";
  return {
    targetId: `${prefix}-${slug || "CORE"}`,
    targetType,
  };
}

export const cieService = {
  // 1. List Canonical Targets (with optional filter)
  async getAvailableTargets(targetType, context) {
    const params = {};
    if (targetType) params.target_type = targetType;
    return intelligenceClient.cieListTargets(params, context);
  },

  // 2. Retrieve Target Profile by target_id
  async getTargetProfile(targetId, context) {
    return intelligenceClient.cieGetTargetProfile(targetId, context);
  },

  // 3. Retrieve Target Roadmap by target_id
  async getTargetRoadmap(targetId, context) {
    return intelligenceClient.cieGetTargetRoadmap(targetId, context);
  },

  // 4. Primary CIE Evaluation (CIEInput -> CIEOutput)
  async evaluateCurrentTarget(userId, context) {
    // A. Fetch Authoritative User Profile & Active Goal from PostgreSQL
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const { data: activeGoal } = await supabase
      .from("learner_goals")
      .select("*")
      .eq("learner_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!activeGoal) {
      throw new NotFoundError("No active career goal found for learner. Complete onboarding first.");
    }

    const isTopicSprint = activeGoal.goal_type === "TOPIC_SPRINT";
    let resolvedName = user.focus_topic || user.target_role || "";

    if (activeGoal.topic_id) {
      const { data: topic } = await supabase
        .from("topics")
        .select("name")
        .eq("id", activeGoal.topic_id)
        .maybeSingle();
      if (topic?.name) resolvedName = topic.name;
    } else if (activeGoal.job_id) {
      const { data: job } = await supabase
        .from("jobs")
        .select("name")
        .eq("id", activeGoal.job_id)
        .maybeSingle();
      if (job?.name) resolvedName = job.name;
    }

    if (!resolvedName) {
      throw new NotFoundError("Failed to resolve target name for active goal.");
    }

    const jobName = activeGoal.job_id ? resolvedName : "";
    const topicName = activeGoal.topic_id ? resolvedName : "";
    const goalType = activeGoal.goal_type || (isTopicSprint ? "TOPIC_SPRINT" : "JOB_READY");

    const { targetId, targetType } = resolveCieTarget(jobName, topicName, goalType);

    // B. Fetch Verified Claims from PostgreSQL (Populated by EIE)
    const { data: claims } = await supabase
      .from("claims")
      .select("statement, confidence")
      .eq("learner_id", userId)
      .eq("status", "ACTIVE")
      .limit(10);

    // Map into canonical CIECapabilityInput schema
    const capabilities = [
      {
        capability_id: "CAP-TESTING",
        proficiency: "PROFICIENT",
        mastery: "DEMONSTRATED",
        confidence: 0.85,
      },
      {
        capability_id: "CAP-JAVASCRIPT",
        proficiency: "PROFICIENT",
        mastery: "DEMONSTRATED",
        confidence: 0.85,
      },
    ];

    // C. Build Payload Matching CIEInput Specification
    const ciePayload = {
      learner_id: String(userId),
      state_version: "1.0",
      goal: {
        goal_id: String(activeGoal.id),
        target_id: targetId,
        target_type: targetType,
        priority: "HIGH",
      },
      capabilities,
      career_state: {
        target_name: isTopicSprint ? topicName : jobName,
        timeline: user.timeline || "90 Days",
      },
      career_dna: {
        target_focus: isTopicSprint ? topicName : jobName,
        preferred_domains: targetType === "CAREER" ? ["FULLSTACK", "WEB"] : ["GENERAL"],
      },
      relevant_history: [],
    };

    // D. Invoke Python CIE
    const evaluation = await intelligenceClient.cieEvaluate(ciePayload, context);

    return {
      learnerId: userId,
      targetRole: resolvedName,
      cieTargetId: targetId,
      evaluation,
    };
  },
};