/**
 * ==============================================================================
 * SERVICE: ROADMAP CURRICULUM & PROGRESSION ENGINE
 * ==============================================================================
 * [BACKEND INTEGRATION POINT - API KEY & PROGRESSION DATABASE REQUIRED]
 *
 * Connects the Candy Crush Road curriculum map to backend database tables:
 * - REST:
 *   - GET  /api/v1/roadmap/track?trackId=ai_ml
 *   - POST /api/v1/roadmap/complete-day
 * - Database Tables:
 *   - `curriculum_tracks` (id, slug, name, total_days, description)
 *   - `curriculum_days` (id, track_id, day_number, title, episode, duration, is_milestone)
 *   - `user_roadmap_progress` (user_id, day_number, status, stars, completed_at)
 */

import { apiFetch } from "./apiConfig";
import { CANDY_CRUSH_SAGA_DAYS } from "../data/mockData";

/**
 * Fetch curriculum track and user progression days
 *
 * [BACKEND ENDPOINT]: GET /roadmap/track
 * [DATABASE QUERY]:
 *   SELECT d.*, p.status, p.stars
 *   FROM curriculum_days d
 *   LEFT JOIN user_roadmap_progress p ON d.day_number = p.day_number AND p.user_id = :userId
 *   ORDER BY d.day_number ASC
 */
export const roadmapService = {
  // 1. Fetch live curriculum and serialized days array
  async getTrack() {
    return apiFetch("/roadmap/track");
  },

  // 2. Mark task complete and trigger auto-unlock of next task
  async completeTask(taskId) {
    return apiFetch(`/tasks/${taskId}/complete`, {
      method: "POST",
    });
  },
};

/**
 * Mark a roadmap day complete and unlock subsequent nodes in database
 *
 * [BACKEND ENDPOINT]: POST /roadmap/complete-day
 * [HEADERS]: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
 * [PAYLOAD]: { dayNumber: number, stars: number, score: number }
 * [DATABASE]:
 *   INSERT INTO user_roadmap_progress (user_id, day_number, status, stars, completed_at)
 *   VALUES (:userId, :dayNumber, 'completed', :stars, NOW())
 *   ON CONFLICT (user_id, day_number) DO UPDATE SET status = 'completed', stars = :stars;
 */
export async function completeRoadmapDay(dayNumber, stars = 3) {
  try {
    const res = await apiFetch("/roadmap/complete-day", {
      method: "POST",
      body: JSON.stringify({ dayNumber, stars }),
    });
    return { success: true, data: res };
  } catch (error) {
    console.warn(`[roadmapService] Complete day ${dayNumber} sync skipped:`, error.message);
    return { success: true, dayNumber, stars, isLocalOnly: true };
  }
}

