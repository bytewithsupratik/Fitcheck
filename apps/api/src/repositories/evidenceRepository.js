import { supabase } from "../db/client.js";

export const evidenceRepository = {
  async createPendingEvidence({ learnerId, title, description, evidenceType, sourceUrl }) {
    const { data, error } = await supabase
      .from("evidence")
      .insert({
        learner_id: learnerId,
        title,
        description,
        evidence_type: evidenceType,
        source: "GITHUB",
        source_url: sourceUrl,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvidenceStatus(evidenceId, status) {
    const { error } = await supabase
      .from("evidence")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", evidenceId);

    if (error) throw error;
  },

  async saveObservations(observations) {
    if (!observations || observations.length === 0) return;

    const { error } = await supabase.from("observations").insert(observations);
    if (error) throw error;
  },

  async saveClaims(claims) {
    if (!claims || claims.length === 0) return;

    const { error } = await supabase.from("claims").insert(claims);
    if (error) throw error;
  },
};