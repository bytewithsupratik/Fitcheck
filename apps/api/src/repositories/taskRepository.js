import { supabase } from "../db/client.js";

export const taskRepository = {
  // Verifies task belongs to the user's active roadmap
  async findTaskWithOwnership(taskId, userId) {
    const { data: task, error } = await supabase
      .from("mission_task")
      .select(`
        id,
        title,
        status,
        task_order,
        mission_id,
        mission:mission!inner (
          id,
          title,
          status,
          mission_order,
          stage:roadmap_stage!inner (
            id,
            stage_order,
            status,
            roadmap:roadmap!inner (
              id,
              user_id
            )
          )
        )
      `)
      .eq("id", taskId)
      .maybeSingle();

    if (error) throw error;
    if (!task || task.mission.stage.roadmap.user_id !== userId) {
      return null;
    }

    return task;
  },

  async markTaskCompleted(taskId) {
    const { data, error } = await supabase
      .from("mission_task")
      .update({ status: "completed" })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTasksByMission(missionId) {
    const { data, error } = await supabase
      .from("mission_task")
      .select("id, task_order, status")
      .eq("mission_id", missionId)
      .order("task_order", { ascending: true });

    if (error) throw error;
    return data;
  },

  async unlockTask(taskId) {
    const { error } = await supabase
      .from("mission_task")
      .update({ status: "in_progress" })
      .eq("id", taskId);

    if (error) throw error;
  },

  async markMissionCompleted(missionId) {
    const { error } = await supabase
      .from("mission")
      .update({ status: "completed" })
      .eq("id", missionId);

    if (error) throw error;
  },

  async unlockStage(stageId) {
    const { error } = await supabase
      .from("roadmap_stage")
      .update({ status: "in_progress" })
      .eq("id", stageId);

    if (error) throw error;
  },
};