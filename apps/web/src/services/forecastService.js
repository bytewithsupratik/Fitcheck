/**
 * ==============================================================================
 * SERVICE: DAILY FORECAST & SPRINT MANAGEMENT
 * ==============================================================================
 * [BACKEND INTEGRATION POINT - API KEY & DATABASE ENDPOINTS REQUIRED]
 *
 * Connects the Daily Forecast view to backend database tables:
 * - REST:
 *   - GET   /api/v1/forecast/today?dayNumber=56
 *   - PATCH /api/v1/forecast/tasks/:taskId
 *   - PATCH /api/v1/forecast/videos/:videoId
 *   - PATCH /api/v1/forecast/materials/:materialId
 * - Database Tables:
 *   - `daily_forecasts` (id, day_number, title, focus_topic, duration, skill_chips)
 *   - `user_daily_tasks` (user_id, forecast_id, task_id, completed, duration)
 *   - `video_lessons` (id, title, duration, is_completed, url)
 *   - `study_materials` (id, title, tag, duration, is_read, takeaways, code_snippet)
 */

import { apiFetch } from "./apiConfig";
import {
  dailyForecastTasks,
  dailyForecastVideos,
  dailyForecastDocs,
  dailyForecastMaterials,
} from "../data/mockData";

/**
 * Fetch today's personalized forecast from backend database
 *
 * [BACKEND ENDPOINT]: GET /forecast/today
 * [HEADERS]: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
 * [DATABASE QUERY]: SELECT * FROM daily_forecasts WHERE day_number = :dayNumber
 */
export async function fetchTodayForecast(dayNumber = 56) {
  try {
    const data = await apiFetch(`/forecast/today?dayNumber=${dayNumber}`);
    return {
      success: true,
      tasks: data.tasks,
      videos: data.videos,
      docs: data.docs,
      materials: data.materials,
    };
  } catch (error) {
    console.warn("[forecastService] Fetch today forecast failed, using seed data:", error.message);
    return {
      success: true,
      tasks: dailyForecastTasks,
      videos: dailyForecastVideos,
      docs: dailyForecastDocs,
      materials: dailyForecastMaterials,
      isMockFallback: true,
    };
  }
}

/**
 * Update completion state of an individual sprint task
 *
 * [BACKEND ENDPOINT]: PATCH /forecast/tasks/:taskId
 * [HEADERS]: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
 * [PAYLOAD]: { completed: boolean }
 * [DATABASE QUERY]: UPDATE user_daily_tasks SET completed = :completed, updated_at = NOW() WHERE task_id = :taskId AND user_id = :userId
 */
export async function updateTaskStatus(taskId, completed) {
  try {
    const res = await apiFetch(`/forecast/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    return { success: true, data: res };
  } catch (error) {
    console.warn(`[forecastService] Task ${taskId} sync skipped:`, error.message);
    return { success: true, taskId, completed, isLocalOnly: true };
  }
}

/**
 * Update lesson video completion status
 *
 * [BACKEND ENDPOINT]: PATCH /forecast/videos/:videoId
 * [HEADERS]: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
 * [PAYLOAD]: { isCompleted: boolean }
 * [DATABASE QUERY]: UPDATE user_video_progress SET is_completed = :isCompleted WHERE video_id = :videoId AND user_id = :userId
 */
export async function updateVideoStatus(videoId, isCompleted) {
  try {
    const res = await apiFetch(`/forecast/videos/${videoId}`, {
      method: "PATCH",
      body: JSON.stringify({ isCompleted }),
    });
    return { success: true, data: res };
  } catch (error) {
    console.warn(`[forecastService] Video ${videoId} sync skipped:`, error.message);
    return { success: true, videoId, isCompleted, isLocalOnly: true };
  }
}

/**
 * Mark architectural study material as read/unread
 *
 * [BACKEND ENDPOINT]: PATCH /forecast/materials/:materialId
 * [HEADERS]: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
 * [PAYLOAD]: { isRead: boolean }
 * [DATABASE QUERY]: UPDATE user_material_progress SET is_read = :isRead WHERE material_id = :materialId AND user_id = :userId
 */
export async function updateMaterialStatus(materialId, isRead) {
  try {
    const res = await apiFetch(`/forecast/materials/${materialId}`, {
      method: "PATCH",
      body: JSON.stringify({ isRead }),
    });
    return { success: true, data: res };
  } catch (error) {
    console.warn(`[forecastService] Material ${materialId} sync skipped:`, error.message);
    return { success: true, materialId, isRead, isLocalOnly: true };
  }
}

