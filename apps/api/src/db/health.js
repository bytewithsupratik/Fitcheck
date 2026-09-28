import { supabase } from "./client.js";

export async function checkDatabaseHealth() {
  const { error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }

  return true;
}