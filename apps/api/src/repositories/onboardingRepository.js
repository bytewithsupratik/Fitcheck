import { supabase } from "../db/client.js";

export const onboardingRepository = {
  async upsertOnboarding({ userId, topicId, jobId, mode, durationDays }) {
    const { data, error } = await supabase
      .from("onboarding")
      .upsert(
        {
          user_id: userId,
          topic_id: topicId,
          job_id: jobId,
          mode,
          duration_days: durationDays,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};