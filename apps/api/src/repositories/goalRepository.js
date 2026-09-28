import { supabase } from "../db/client.js";

export const goalRepository = {
  async cancelActiveGoals(learnerId) {
    const { error } = await supabase
      .from("learner_goals")
      .update({
        status: "cancelled",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("learner_id", learnerId)
      .eq("status", "active");

    if (error) throw error;
  },

  async createActiveGoal({ learnerId, topicId, jobId, goalType }) {
    const { data, error } = await supabase
      .from("learner_goals")
      .insert({
        learner_id: learnerId,
        topic_id: topicId,
        job_id: jobId,
        goal_type: goalType,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};