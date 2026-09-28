import { supabase } from "../db/client.js";

export const learnerRepository = {
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from("learners")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async ensureForUser(userId) {
    // 1. Check if already exists
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    // 2. Create if absent
    const { data, error } = await supabase
      .from("learners")
      .insert({ id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};