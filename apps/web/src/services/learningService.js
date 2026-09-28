import { apiFetch } from "./apiConfig";

export const learningService = {
  // 1. Fetch live active learning experience (or auto-generate if missing)
  async getCurrentExperience() {
    const res = await apiFetch("/learning/current");
    return res.data || res;
  },

  // 2. Mark an individual learning step as completed in MIE
  async completeStep(experienceId, stepId) {
    return apiFetch(`/learning/experiences/${experienceId}/steps/${stepId}/complete`, {
      method: "POST",
    });
  },

  // 3. Submit project GitHub URL for evidence evaluation
  async submitProject(projectId, githubUrl) {
    return apiFetch(`/learning/projects/${projectId}/submission`, {
      method: "POST",
      body: JSON.stringify({ github_url: githubUrl }),
    });
  },
};