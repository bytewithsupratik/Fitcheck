import { supabase } from "../db/client.js";

export const progressRepository = {
  async upsertMissionProgress({ missionId, userId, progress, status }) {
    const isCompleted = status === "completed";

    const { data, error } = await supabase
      .from("mission_progress")
      .upsert(
        {
          mission_id: missionId,
          user_id: userId,
          progress,
          status,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mission_id,user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};