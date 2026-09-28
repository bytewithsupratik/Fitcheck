import { apiFetch } from "./apiConfig";
import {
  RADIAL_SKILLS,
  GROWTH_TIMELINE,
  defaultWorkspaceStats,
} from "../data/mockData";

/**
 * Fetch core telemetry metrics (Readiness, Streak, Goal, Velocity)
 * Calls live backend at GET /dashboard/metrics
 */
export async function fetchDashboardMetrics() {
  try {
    return await apiFetch("/dashboard/metrics");
  } catch (error) {
    console.warn("[dashboardService] Remote metrics offline, using fallback:", error.message);
    return {
      success: true,
      readiness: defaultWorkspaceStats?.readiness || "30%",
      streak: defaultWorkspaceStats?.streak || "1 Day",
      goal: defaultWorkspaceStats?.goal || "85%",
      velocity: "Standard",
      metrics: {
        readinessPct: 30,
        streakDays: 1,
        goalPct: 85,
        dayNumber: defaultWorkspaceStats?.dayNumber || 1,
        target: defaultWorkspaceStats?.targetRole || "CSS",
      },
      isMockFallback: true,
    };
  }
}

/**
 * Fetch 6-axis Radial Skill comparison against industry standard
 * Calls live backend at GET /dashboard/skills
 */
export async function fetchSkillEvaluations() {
  try {
    const data = await apiFetch("/dashboard/skills");
    return { success: true, skills: data.skills, timeline: data.timeline };
  } catch (error) {
    console.warn("[dashboardService] Remote skills offline, using fallback:", error.message);
    return {
      success: true,
      skills: RADIAL_SKILLS || [],
      timeline: GROWTH_TIMELINE || [],
      isMockFallback: true,
    };
  }
}

/**
 * Fetch verified evidence certificates and audit logs
 * Calls live backend at GET /dashboard/evidence
 */
export async function fetchEvidenceRecords() {
  try {
    const data = await apiFetch("/dashboard/evidence");
    return { success: true, evidence: data.evidence };
  } catch (error) {
    console.warn("[dashboardService] Remote evidence offline, using fallback:", error.message);
    return {
      success: true,
      evidence: [],
      isMockFallback: true,
    };
  }
}

// Unified export object matching Home.jsx requirements
export const dashboardService = {
  getMetrics: fetchDashboardMetrics,
  fetchDashboardMetrics,
  fetchSkillEvaluations,
  fetchEvidenceRecords,
};

export default dashboardService;