import { supabase } from "../db/client.js";

export const catalogRepository = {
  async findJobByNameOrId(identifier) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    // 1. Try to find existing job
    const query = supabase.from("jobs").select("*");
    if (isUuid) {
      query.eq("id", identifier);
    } else {
      query.ilike("name", `%${identifier}%`);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (data) return data;

    // 2. If not found and not a UUID, auto-create it in public.jobs so onboarding never blocks!
    if (!isUuid && identifier) {
      const { data: newJob } = await supabase
        .from("jobs")
        .insert({ name: identifier.trim() })
        .select()
        .single();

      if (newJob) return newJob;
    }

    return null;
  },

  async findTopicByNameOrId(identifier) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    // 1. Try to find existing topic
    const query = supabase.from("topics").select("*");
    if (isUuid) {
      query.eq("id", identifier);
    } else {
      query.ilike("name", `%${identifier}%`);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (data) return data;

    // 2. If not found and not a UUID, auto-create it in public.topics so onboarding never blocks!
    if (!isUuid && identifier) {
      const { data: newTopic } = await supabase
        .from("topics")
        .insert({ name: identifier.trim() })
        .select()
        .single();

      if (newTopic) return newTopic;
    }

    return null;
  },
};