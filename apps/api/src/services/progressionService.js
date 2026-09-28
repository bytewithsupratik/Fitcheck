import { taskRepository } from "../repositories/taskRepository.js";
import { progressRepository } from "../repositories/progressRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

export const progressionService = {
  async completeTask(userId, taskId) {
    // 1. Verify Task & Ownership
    const task = await taskRepository.findTaskWithOwnership(taskId, userId);
    if (!task) {
      throw new NotFoundError("Task not found or does not belong to your roadmap");
    }

    // 2. Strict Idempotency: Return early if already completed
    if (task.status === "completed") {
      return {
        idempotent: true,
        message: "Task is already completed",
        taskId: task.id,
        status: "completed",
      };
    }

    // 3. Mark Task as Completed
    await taskRepository.markTaskCompleted(taskId);

    // 4. Calculate Mission Progress
    const missionTasks = await taskRepository.getTasksByMission(task.mission_id);
    const completedCount = missionTasks.filter((t) => t.id === taskId || t.status === "completed").length;
    const progressPct = Math.round((completedCount / missionTasks.length) * 100);
    const missionCompleted = progressPct === 100;

    await progressRepository.upsertMissionProgress({
      missionId: task.mission_id,
      userId,
      progress: progressPct,
      status: missionCompleted ? "completed" : "in_progress",
    });

    // 5. Unlock Next Step
    let nextUnlockedTaskId = null;

    if (!missionCompleted) {
      // Unlock next task in this mission
      const nextTask = missionTasks.find((t) => t.task_order === task.task_order + 1);
      if (nextTask) {
        await taskRepository.unlockTask(nextTask.id);
        nextUnlockedTaskId = nextTask.id;
      }
    } else {
      // Mission is complete
      await taskRepository.markMissionCompleted(task.mission_id);
    }

    // 6. Update User Streak, Readiness & Advance Day Number in public.users
    const user = await userRepository.findById(userId);
    const newStreak = (user?.streak_days || 0) + 1;
    const newReadiness = Math.min(100, (user?.readiness_pct || 25) + 5);
    const newDayNumber = (user?.day_number || 1) + 1;

    await userRepository.updateProfile(userId, {
      streak_days: newStreak,
      readiness_pct: newReadiness,
      day_number: newDayNumber,
    });

    return {
      idempotent: false,
      message: "Task completed successfully",
      taskId: task.id,
      missionProgress: `${progressPct}%`,
      missionCompleted,
      nextUnlockedTaskId,
      newStreak,
      newReadiness: `${newReadiness}%`,
    };
  },
};