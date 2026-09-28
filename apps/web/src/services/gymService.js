import { apiFetch } from "./apiConfig";

export async function fetchGymChallenges() {
  return apiFetch("/gym/challenges");
}

export async function verifyGymRepository(repoUrl, sprintChallengeId) {
  return apiFetch("/gym/verify-repo", {
    method: "POST",
    body: JSON.stringify({ repoUrl, sprintChallengeId }),
  });
}

export async function submitCodeSolution(challengeId, code, language = "javascript") {
  return apiFetch("/gym/submit-code", {
    method: "POST",
    body: JSON.stringify({ challengeId, code, language }),
  });
}

