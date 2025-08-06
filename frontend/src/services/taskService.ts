import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

// Task Service class
class TaskService {
  /**
   * Get all tasks with optional filtering
   */
  async getTasks(params?: {
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
  }): Promise<ApiResponse<{ tasks: Task[]; total: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.TASKS.BASE}${queryParams ? `?${queryParams}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    try {
      return await apiClient.get(API_ENDPOINTS.TASKS.BY_ID(id));
    } catch (error) {
      console.error('Get task by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new task
   */
  async createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
    try {
      return await apiClient.post(API_ENDPOINTS.TASKS.BASE, taskData);
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  /**
   * Update existing task
   */
  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    try {
      return await apiClient.put(API_ENDPOINTS.TASKS.BY_ID(id), taskData);
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(API_ENDPOINTS.TASKS.BY_ID(id));
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'review' | 'done'): Promise<ApiResponse<Task>> {
    try {
      return await apiClient.put(API_ENDPOINTS.TASKS.STATUS(id), { status });
    } catch (error) {
      console.error('Update task status error:', error);
      throw error;
    }
  }

  /**
   * Assign task to user
   */
  async assignTask(id: string, assigneeId: string): Promise<ApiResponse<Task>> {
    try {
      return await apiClient.patch(API_ENDPOINTS.TASKS.BY_ID(id), { assigneeId });
    } catch (error) {
      console.error('Assign task error:', error);
      throw error;
    }
  }

  /**
   * Add watcher to task
   */
  async addTaskWatcher(taskId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TASKS.BY_ID(taskId)}/watchers`, { userId });
    } catch (error) {
      console.error('Add task watcher error:', error);
      throw error;
    }
  }

  /**
   * Remove watcher from task
   */
  async removeTaskWatcher(taskId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.TASKS.BY_ID(taskId)}/watchers/${userId}`);
    } catch (error) {
      console.error('Remove task watcher error:', error);
      throw error;
    }
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: string, params?: {
    status?: string;
    assigneeId?: string;
    priority?: string;
  }): Promise<ApiResponse<Task[]>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.PROJECTS.TASKS(projectId)}${queryParams ? `?${queryParams}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get tasks by project error:', error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to user
   */
  async getTasksByAssignee(assigneeId: string, params?: {
    status?: string;
    projectId?: string;
    overdue?: boolean;
  }): Promise<ApiResponse<Task[]>> {
    try {
      const queryParams = new URLSearchParams({ ...params, assigneeId } as any).toString();
      const url = `${API_ENDPOINTS.TASKS.BASE}?${queryParams}`;
      
      const response = await apiClient.get<{ tasks: Task[]; total: number; page: number; limit: number }>(url);
      return {
        ...response,
        data: response.data.tasks
      };
    } catch (error) {
      console.error('Get tasks by assignee error:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(params?: {
    projectId?: string;
    assigneeId?: string;
  }): Promise<ApiResponse<Task[]>> {
    try {
      const queryParams = new URLSearchParams({ ...params, overdue: 'true' } as any).toString();
      const url = `${API_ENDPOINTS.TASKS.BASE}?${queryParams}`;
      
      const response = await apiClient.get<{ tasks: Task[]; total: number; page: number; limit: number }>(url);
      return {
        ...response,
        data: response.data.tasks
      };
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(params?: {
    projectId?: string;
    assigneeId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completed: number;
    averageCompletionTime: number;
  }>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.TASKS.BASE}/stats${queryParams ? `?${queryParams}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get task stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const taskService = new TaskService();