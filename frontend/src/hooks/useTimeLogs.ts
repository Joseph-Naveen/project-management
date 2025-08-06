import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingService } from '../services/timeTrackingService';
import type { CreateTimeLogRequest, UpdateTimeLogRequest } from '../types';

// Query keys for consistent caching
export const timeLogQueryKeys = {
  all: ['time-logs'] as const,
  lists: () => [...timeLogQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...timeLogQueryKeys.lists(), { filters }] as const,
  details: () => [...timeLogQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeLogQueryKeys.details(), id] as const,
  byUser: (userId: string) => [...timeLogQueryKeys.all, 'user', userId] as const,
  byTask: (taskId: string) => [...timeLogQueryKeys.all, 'task', taskId] as const,
  byProject: (projectId: string) => [...timeLogQueryKeys.all, 'project', projectId] as const,
};

// Hook for fetching time logs list
export const useTimeLogs = (params?: {
  userId?: string;
  taskId?: string;
  projectId?: string;
  dateRange?: { start: string; end: string };
  approved?: boolean;
  billable?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: timeLogQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await timeTrackingService.getTimeLogs(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single time log
export const useTimeLog = (id: string, enabled = true) => {
  return useQuery({
    queryKey: timeLogQueryKeys.detail(id),
    queryFn: async () => {
      const response = await timeTrackingService.getTimeLogById(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for creating a time log
export const useCreateTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeLogData: CreateTimeLogRequest) => {
      const response = await timeTrackingService.createTimeLog(timeLogData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch time logs lists
      queryClient.invalidateQueries({ queryKey: timeLogQueryKeys.all });
    },
    onError: (error) => {
      console.error('Error creating time log:', error);
    },
  });
};

// Hook for updating a time log
export const useUpdateTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimeLogRequest }) => {
      const response = await timeTrackingService.updateTimeLog(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the cache for the specific time log
      queryClient.setQueryData(timeLogQueryKeys.detail(data.id), data);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: timeLogQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Error updating time log:', error);
    },
  });
};

// Hook for deleting a time log
export const useDeleteTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await timeTrackingService.deleteTimeLog(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch time logs lists
      queryClient.invalidateQueries({ queryKey: timeLogQueryKeys.all });
    },
    onError: (error) => {
      console.error('Error deleting time log:', error);
    },
  });
};

// Hook for getting time logs by user
export const useUserTimeLogs = (userId: string, params?: {
  dateRange?: { start: string; end: string };
  approved?: boolean;
  billable?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useTimeLogs({ userId, ...params });
};

// Hook for getting time logs by task
export const useTaskTimeLogs = (taskId: string, params?: {
  userId?: string;
  dateRange?: { start: string; end: string };
  approved?: boolean;
  billable?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useTimeLogs({ taskId, ...params });
};

// Hook for getting time logs by project
export const useProjectTimeLogs = (projectId: string, params?: {
  userId?: string;
  dateRange?: { start: string; end: string };
  approved?: boolean;
  billable?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useTimeLogs({ projectId, ...params });
};
