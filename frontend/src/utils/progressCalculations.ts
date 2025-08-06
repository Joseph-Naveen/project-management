import type { Project, Task } from '../types/models';

/**
 * Calculate project progress percentage based on task completion
 * @param project Project object
 * @returns Progress percentage (0-100)
 */
export const calculateProjectProgress = (project: Project): number => {
  // If project has taskCounts, use them for calculation
  if (project.taskCounts) {
    const { todo, inProgress, review, done } = project.taskCounts;
    const totalTasks = todo + inProgress + review + done;
    
    if (totalTasks === 0) return 0;
    return Math.round((done / totalTasks) * 100);
  }
  
  // If project has a taskCount and explicit progress, use it
  if (project.progress !== undefined) {
    return project.progress;
  }
  
  // Fallback to 0
  return 0;
};

/**
 * Calculate progress from tasks array
 * @param tasks Array of tasks
 * @returns Progress percentage (0-100)
 */
export const calculateProgressFromTasks = (tasks: Task[]): number => {
  if (!tasks || tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

/**
 * Get task status counts from tasks array
 * @param tasks Array of tasks
 * @returns Object with counts for each status
 */
export const getTaskStatusCounts = (tasks: Task[]) => {
  const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };
  
  tasks.forEach(task => {
    if (task.status in counts) {
      counts[task.status as keyof typeof counts]++;
    }
  });
  
  return counts;
};

/**
 * Calculate completion percentage for any entity with task counts
 * @param taskCounts Object with task status counts
 * @returns Progress percentage (0-100)
 */
export const calculateCompletionPercentage = (taskCounts: {
  todo: number;
  in_progress: number;
  review: number;
  done: number;
}): number => {
  const { todo, in_progress, review, done } = taskCounts;
  const totalTasks = todo + in_progress + review + done;
  
  if (totalTasks === 0) return 0;
  return Math.round((done / totalTasks) * 100);
};
