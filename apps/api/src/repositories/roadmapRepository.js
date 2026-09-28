import { supabase } from "../db/client.js";

export const roadmapRepository = {
  async findActiveRoadmap(userId) {
    const { data: roadmap, error } = await supabase
      .from("roadmap")
      .select(`
        id,
        status,
        version,
        job_id,
        stages:roadmap_stage (
          id,
          title,
          description,
          stage_order,
          status,
          missions:mission (
            id,
            title,
            description,
            status,
            mission_order,
            tasks:mission_task (
              id,
              title,
              description,
              task_order,
              status
            )
          )
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    return roadmap;
  },

  async createBaselineRoadmap(userId, jobId, targetTitle = "Mastery", totalDays = 90) {
    const normalizedTotalDays = Math.max(1, Math.round(Number(totalDays) || 90));

    // 1. Create Roadmap Header
    const { data: roadmap, error: rError } = await supabase
      .from("roadmap")
      .insert({
        user_id: userId,
        job_id: jobId,
        status: "active",
        version: 1,
      })
      .select()
      .single();

    if (rError) throw rError;

    // 2. Create Stage 1
    const { data: stage1, error: sError } = await supabase
      .from("roadmap_stage")
      .insert({
        roadmap_id: roadmap.id,
        title: `Stage 1: ${targetTitle} Fundamentals`,
        description: `Master core principles, syntax, and foundational patterns of ${targetTitle}.`,
        stage_order: 1,
        status: "in_progress",
      })
      .select()
      .single();

    if (sError) throw sError;

    // 3. Create Stage 2 (Locked)
    const { data: stage2, error: s2Error } = await supabase
      .from("roadmap_stage")
      .insert({
      roadmap_id: roadmap.id,
      title: `Stage 2: Advanced ${targetTitle} & System Integration`,
      description: `Build real-world production architectures, optimization, and scaling with ${targetTitle}.`,
      stage_order: 2,
      status: "not_started",
      })
      .select()
      .single();

    if (s2Error) throw s2Error;

    // 4. Create Mission 1 under Stage 1
    const { data: mission1, error: mError } = await supabase
      .from("mission")
      .insert({
        stage_id: stage1.id,
        title: `Mission 1: ${targetTitle} Core Scaffolding`,
        description: `Hands-on implementation of primary ${targetTitle} components.`,
        mission_order: 1,
        status: "in_progress",
      })
      .select()
      .single();

    if (mError) throw mError;

    const foundationDays = Math.ceil(normalizedTotalDays / 2);
    const applicationDays = normalizedTotalDays - foundationDays;
    let mission2 = null;

    if (applicationDays > 0) {
      const { data, error } = await supabase
        .from("mission")
        .insert({
          stage_id: stage2.id,
          title: `Mission 2: ${targetTitle} Production Application`,
          description: `Apply ${targetTitle} patterns through integration, testing, and optimization.`,
          mission_order: 1,
          status: "not_started",
        })
        .select()
        .single();

      if (error) throw error;
      mission2 = data;
    }

    // 5. Create one task for each day in the configured timeline.
    const tasks = Array.from({ length: normalizedTotalDays }, (_, index) => {
      const dayNumber = index + 1;
      const isFoundation = dayNumber <= foundationDays;
      return {
        mission_id: isFoundation ? mission1.id : mission2.id,
        title: `${targetTitle} ${isFoundation ? "Foundations" : "Production Application"} - Day ${dayNumber}`,
        description: isFoundation
          ? `Build foundational knowledge and clean implementation patterns for ${targetTitle}.`
          : `Apply ${targetTitle} through integration, testing, performance, and scaling work.`,
        task_order: isFoundation ? dayNumber : dayNumber - foundationDays,
        status: dayNumber === 1 ? "in_progress" : "not_started",
      };
    });

    const { error: tError } = await supabase.from("mission_task").insert(tasks);
    if (tError) throw tError;

    // Return the freshly created hierarchy
    return this.findActiveRoadmap(userId);
  },
};