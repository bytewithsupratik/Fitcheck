import { supabase } from "../db/client.js";

export const dashboardRepository = {
  async getUserMetrics(userId) {
    // 1. Fetch user telemetry
    const { data: user, error: uError } = await supabase
      .from("users")
      .select("id, streak_days, day_number, readiness_pct, goal_pct, target_role, focus_topic")
      .eq("id", userId)
      .single();

    if (uError) throw uError;

    // 2. Fetch completed missions count
    const { count: completedMissionsCount, error: mError } = await supabase
      .from("mission_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    if (mError) throw mError;

    return {
      user,
      completedMissionsCount: completedMissionsCount || 0,
    };
  },

  async getUserEvidence(userId) {
    const { data, error } = await supabase
      .from("evidence")
      .select(`
        id,
        title,
        description,
        evidence_type,
        source,
        source_url,
        status,
        submitted_at,
        observations:observations(id, observation_type, description)
      `)
      .eq("learner_id", userId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};