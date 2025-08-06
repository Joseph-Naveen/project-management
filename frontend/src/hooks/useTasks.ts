import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

// Query keys for consistent caching
export const taskQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskQueryKeys.lists(), { filters }] as const,
  details: () => [...taskQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskQueryKeys.details(), id] as const,
  byProject: (projectId: string) => [...taskQueryKeys.all, 'project', projectId] as const,
  byAssignee: (assigneeId: string) => [...taskQueryKeys.all, 'assignee', assigneeId] as const,
  overdue: () => [...taskQueryKeys.all, 'overdue'] as const,
  stats: () => [...taskQueryKeys.all, 'stats'] as const,
  projectStats: (projectId: string) => [...taskQueryKeys.stats(), 'project', projectId] as const,
  userStats: (userId: string) => [...taskQueryKeys.stats(), 'user', userId] as const,
};

// Hook for fetching tasks list
export const useTasks = (params?: {
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
  dueDate?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: taskQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await taskService.getTasks(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single task
export const useTask = (id: string, enabled = true) => {
  return useQuery({
    queryKey: taskQueryKeys.detail(id),
    queryFn: async () => {
      const response = await taskService.getTaskById(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching tasks by project
export const useProjectTasks = (projectId: string, params?: {
  status?: string;
  assigneeId?: string;
  priority?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: taskQueryKeys.byProject(projectId),
    queryFn: async () => {
      const response = await taskService.getTasksByProject(projectId, params);
      return response.data;
    },
    enabled: enabled && !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching tasks by assignee
export const useAssigneeTasks = (assigneeId: string, params?: {
  status?: string;
  projectId?: string;
  overdue?: boolean;
}, enabled = true) => {
  return useQuery({
    queryKey: taskQueryKeys.byAssignee(assigneeId),
    queryFn: async () => {
      const response = await taskService.getTasksByAssignee(assigneeId, params);
      return response.data;
    },
    enabled: enabled && !!assigneeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook for fetching overdue tasks
export const useOverdueTasks = (params?: {
  projectId?: string;
  assigneeId?: string;
}) => {
  return useQuery({
    queryKey: taskQueryKeys.overdue(),
    queryFn: async () => {
      const response = await taskService.getOverdueTasks(params);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds (overdue status changes frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching task statistics
export const useTaskStats = (params?: {
  projectId?: string;
  assigneeId?: string;
  dateRange?: { start: string; end: string };
}) => {
  const queryKey = params?.projectId 
    ? taskQueryKeys.projectStats(params.projectId)
    : params?.assigneeId 
    ? taskQueryKeys.userStats(params.assigneeId)
    : taskQueryKeys.stats();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await taskService.getTaskStats(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for creating a task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const response = await taskService.createTask(taskData);
      return response.data;
    },
    onSuccess: (newTask) => {
      // Invalidate tasks lists to refetch
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      
      // Add the new task to the cache
      queryClient.setQueryData(taskQueryKeys.detail(newTask.id), newTask);
      
      // Invalidate project tasks if task belongs to a project
      if (newTask.projectId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(newTask.projectId) });
      }
      
      // Invalidate assignee tasks if task has an assignee
      if (newTask.assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(newTask.assigneeId) });
      }
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Create task error:', error);
    }
  });
};

// Hook for updating a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskRequest }) => {
      const response = await taskService.updateTask(id, data);
      return response.data;
    },
    onSuccess: (updatedTask, { data }) => {
      // Update the task in cache
      queryClient.setQueryData(taskQueryKeys.detail(updatedTask.id), updatedTask);
      
      // If assignee changed, invalidate both old and new assignee task lists
      const oldTask = queryClient.getQueryData<Task>(taskQueryKeys.detail(updatedTask.id));
      if (oldTask?.assigneeId !== updatedTask.assigneeId) {
        if (oldTask?.assigneeId) {
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(oldTask.assigneeId) });
        }
        if (updatedTask.assigneeId) {
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(updatedTask.assigneeId) });
        }
      }
      
      // Invalidate tasks lists and project tasks
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      
      if (updatedTask.projectId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(updatedTask.projectId) });
      }
      
      // Invalidate stats if status changed
      if (data.status) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.overdue() });
      }
    },
    onError: (error) => {
      console.error('Update task error:', error);
    }
  });
};

// Hook for deleting a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await taskService.deleteTask(id);
      return id;
    },
    onSuccess: (deletedId) => {
      const deletedTask = queryClient.getQueryData<Task>(taskQueryKeys.detail(deletedId));
      
      // Remove task from cache
      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(deletedId) });
      
      // Invalidate tasks lists
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      
      // Invalidate related queries
      if (deletedTask?.projectId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(deletedTask.projectId) });
      }
      
      if (deletedTask?.assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(deletedTask.assigneeId) });
      }
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.overdue() });
    },
    onError: (error) => {
      console.error('Delete task error:', error);
    }
  });
};

// Hook for updating task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'todo' | 'in_progress' | 'review' | 'done' }) => {
      const response = await taskService.updateTaskStatus(id, status);
      return response.data;
    },
    onSuccess: (updatedTask) => {
      // Update the task in cache
      queryClient.setQueryData(taskQueryKeys.detail(updatedTask.id), updatedTask);
      
      // Invalidate lists to reflect status change
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      
      if (updatedTask.projectId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(updatedTask.projectId) });
      }
      
      if (updatedTask.assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(updatedTask.assigneeId) });
      }
      
      // Invalidate stats and overdue tasks
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.overdue() });
    },
    onError: (error) => {
      console.error('Update task status error:', error);
    }
  });
};

// Hook for assigning a task
export const useAssignTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string }) => {
      const response = await taskService.assignTask(id, assigneeId);
      return response.data;
    },
    onSuccess: (updatedTask) => {
      const oldTask = queryClient.getQueryData<Task>(taskQueryKeys.detail(updatedTask.id));
      
      // Update the task in cache
      queryClient.setQueryData(taskQueryKeys.detail(updatedTask.id), updatedTask);
      
      // Invalidate old assignee's task list
      if (oldTask?.assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(oldTask.assigneeId) });
      }
      
      // Invalidate new assignee's task list
      if (updatedTask.assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(updatedTask.assigneeId) });
      }
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      
      if (updatedTask.projectId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(updatedTask.projectId) });
      }
    },
    onError: (error) => {
      console.error('Assign task error:', error);
    }
  });
};

// Hook for adding/removing task watchers
export const useTaskWatchers = () => {
  const queryClient = useQueryClient();

  const addWatcher = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      await taskService.addTaskWatcher(taskId, userId);
      return { taskId, userId };
    },
    onSuccess: ({ taskId }) => {
      // Invalidate task to refetch with updated watchers
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) });
    },
    onError: (error) => {
      console.error('Add task watcher error:', error);
    }
  });

  const removeWatcher = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      await taskService.removeTaskWatcher(taskId, userId);
      return { taskId, userId };
    },
    onSuccess: ({ taskId }) => {
      // Invalidate task to refetch with updated watchers
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) });
    },
    onError: (error) => {
      console.error('Remove task watcher error:', error);
    }
  });

  return {
    addWatcher,
    removeWatcher
  };
};

// Hook for task filtering and search
export const useTaskFilters = () => {
  const getTodoTasks = (params?: Omit<Parameters<typeof useTasks>[0], 'status'>) => {
    return useTasks({ ...params, status: 'todo' });
  };

  const getInProgressTasks = (params?: Omit<Parameters<typeof useTasks>[0], 'status'>) => {
    return useTasks({ ...params, status: 'in_progress' });
  };

  const getCompletedTasks = (params?: Omit<Parameters<typeof useTasks>[0], 'status'>) => {
    return useTasks({ ...params, status: 'done' });
  };

  const getHighPriorityTasks = (params?: Omit<Parameters<typeof useTasks>[0], 'priority'>) => {
    return useTasks({ ...params, priority: 'high' });
  };

  const getCriticalTasks = (params?: Omit<Parameters<typeof useTasks>[0], 'priority'>) => {
    return useTasks({ ...params, priority: 'critical' });
  };

  const getMyTasks = (userId: string, params?: Omit<Parameters<typeof useTasks>[0], 'assigneeId'>) => {
    return useTasks({ ...params, assigneeId: userId });
  };

  const getCreatedTasks = (userId: string, params?: Omit<Parameters<typeof useTasks>[0], 'creatorId'>) => {
    return useTasks({ ...params, creatorId: userId });
  };

  const searchTasks = (searchQuery: string, params?: Omit<Parameters<typeof useTasks>[0], 'search'>) => {
    return useTasks({ ...params, search: searchQuery });
  };

  return {
    getTodoTasks,
    getInProgressTasks,
    getCompletedTasks,
    getHighPriorityTasks,
    getCriticalTasks,
    getMyTasks,
    getCreatedTasks,
    searchTasks
  };
};

// Hook for optimistic updates
export const useOptimisticTaskUpdate = () => {
  const queryClient = useQueryClient();

  const updateTaskOptimistically = (id: string, updates: Partial<Task>) => {
    queryClient.setQueryData(
      taskQueryKeys.detail(id),
      (old: Task | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      }
    );
  };

  const revertOptimisticUpdate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(id) });
  };

  return {
    updateTaskOptimistically,
    revertOptimisticUpdate
  };
};

// Hook for bulk operations
export const useBulkTaskOperations = () => {
  const queryClient = useQueryClient();

  const bulkUpdateTasks = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: UpdateTaskRequest }>) => {
      const promises = updates.map(({ id, data }) => 
        taskService.updateTask(id, data)
      );
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedTasks) => {
      // Update each task in cache
      updatedTasks.forEach(task => {
        queryClient.setQueryData(taskQueryKeys.detail(task.id), task);
      });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Bulk update tasks error:', error);
    }
  });

  const bulkDeleteTasks = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => taskService.deleteTask(id));
      await Promise.all(promises);
      return ids;
    },
    onSuccess: (deletedIds) => {
      // Remove tasks from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: taskQueryKeys.detail(id) });
      });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Bulk delete tasks error:', error);
    }
  });

  const bulkAssignTasks = useMutation({
    mutationFn: async ({ taskIds, assigneeId }: { taskIds: string[]; assigneeId: string }) => {
      const promises = taskIds.map(id => taskService.assignTask(id, assigneeId));
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedTasks) => {
      // Update tasks in cache
      updatedTasks.forEach(task => {
        queryClient.setQueryData(taskQueryKeys.detail(task.id), task);
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      
      // Invalidate assignee tasks for the new assignee
      const assigneeId = updatedTasks[0]?.assigneeId;
      if (assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(assigneeId) });
      }
    },
    onError: (error) => {
      console.error('Bulk assign tasks error:', error);
    }
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ taskIds, status }: { 
      taskIds: string[]; 
      status: 'todo' | 'in_progress' | 'review' | 'done' 
    }) => {
      const promises = taskIds.map(id => taskService.updateTaskStatus(id, status));
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedTasks) => {
      // Update tasks in cache
      updatedTasks.forEach(task => {
        queryClient.setQueryData(taskQueryKeys.detail(task.id), task);
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.overdue() });
    },
    onError: (error) => {
      console.error('Bulk update status error:', error);
    }
  });

  return {
    bulkUpdateTasks,
    bulkDeleteTasks,
    bulkAssignTasks,
    bulkUpdateStatus
  };
};

// Hook for prefetching tasks
export const usePrefetchTask = () => {
  const queryClient = useQueryClient();

  const prefetchTask = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: taskQueryKeys.detail(id),
      queryFn: async () => {
        const response = await taskService.getTaskById(id);
        return response.data;
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  const prefetchProjectTasks = (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: taskQueryKeys.byProject(projectId),
      queryFn: async () => {
        const response = await taskService.getTasksByProject(projectId);
        return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  const prefetchAssigneeTasks = (assigneeId: string) => {
    queryClient.prefetchQuery({
      queryKey: taskQueryKeys.byAssignee(assigneeId),
      queryFn: async () => {
        const response = await taskService.getTasksByAssignee(assigneeId);
        return response.data;
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  return {
    prefetchTask,
    prefetchProjectTasks,
    prefetchAssigneeTasks
  };
};