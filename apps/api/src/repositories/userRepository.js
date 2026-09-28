import { supabase } from "../db/client.js";

export const userRepository = {
  async create({ authUserId, email, username }) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        email,
        username,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findByAuthUserId(authUserId) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(id, updates) {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};