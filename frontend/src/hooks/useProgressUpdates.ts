import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to handle progress bar updates when task status changes
 */
export const useProgressUpdates = () => {
  const queryClient = useQueryClient();

  /**
   * Invalidate project-related queries to refresh progress calculations
   */
  const invalidateProjectData = useCallback(async (projectId?: string) => {
    const promises = [
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'projects'] }),
      
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      
      // Invalidate reports data
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ];

    // If specific project ID provided, invalidate that project's data
    if (projectId) {
      promises.push(
        queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      );
    }

    await Promise.all(promises);
  }, [queryClient]);

  /**
   * Invalidate task-related queries to refresh task progress
   */
  const invalidateTaskData = useCallback(async (taskId?: string, projectId?: string) => {
    const promises = [
      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      
      // Invalidate task stats
      queryClient.invalidateQueries({ queryKey: ['task-stats'] }),
    ];

    // If specific task ID provided, invalidate that task's data
    if (taskId) {
      promises.push(
        queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
      );
    }

    // If project ID provided, invalidate project's tasks
    if (projectId) {
      promises.push(
        queryClient.invalidateQueries({ queryKey: ['tasks', 'project', projectId] })
      );
    }

    await Promise.all(promises);
    
    // Also invalidate project data since task changes affect project progress
    if (projectId) {
      await invalidateProjectData(projectId);
    }
  }, [queryClient, invalidateProjectData]);

  /**
   * Handle task status change and trigger necessary data refreshes
   */
  const onTaskStatusChange = useCallback(async (taskId: string, projectId: string, newStatus: string) => {
    console.log(`🔄 Task ${taskId} status changed to ${newStatus}, updating progress bars...`);
    
    // Invalidate both task and project data
    await Promise.all([
      invalidateTaskData(taskId, projectId),
      invalidateProjectData(projectId)
    ]);
    
    console.log('✅ Progress data refreshed');
  }, [invalidateTaskData, invalidateProjectData]);

  /**
   * Handle project data refresh (useful for manual refresh buttons)
   */
  const refreshProjectProgress = useCallback(async (projectId?: string) => {
    console.log(`🔄 Refreshing project progress${projectId ? ` for project ${projectId}` : ' for all projects'}...`);
    await invalidateProjectData(projectId);
    console.log('✅ Project progress refreshed');
  }, [invalidateProjectData]);

  return {
    onTaskStatusChange,
    refreshProjectProgress,
    invalidateProjectData,
    invalidateTaskData,
  };
};
