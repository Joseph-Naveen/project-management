import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { TimeLog, CreateTimeLogRequest, UpdateTimeLogRequest } from '../types';

// Time Tracking Service class
class TimeTrackingService {
  /**
   * Get time logs with optional filtering
   */
  async getTimeLogs(params?: {
    userId?: string;
    taskId?: string;
    projectId?: string;
    dateRange?: { start: string; end: string };
    approved?: boolean;
    billable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ timeLogs: TimeLog[]; total: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'dateRange' && typeof value === 'object' && value.start && value.end) {
              // Transform dateRange to startDate and endDate
              queryParams.append('startDate', value.start);
              queryParams.append('endDate', value.end);
            } else if (key !== 'dateRange') {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const url = `${API_ENDPOINTS.TIME_LOGS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get time logs error:', error);
      throw error;
    }
  }

  /**
   * Get time log by ID
   */
  async getTimeLogById(id: string): Promise<ApiResponse<TimeLog>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TIME_LOGS.BASE}/${id}`);
    } catch (error) {
      console.error('Get time log by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new time log
   */
  async createTimeLog(timeLogData: CreateTimeLogRequest): Promise<ApiResponse<TimeLog>> {
    try {
      // If taskId is specified, use task-specific endpoint for better integration
      const endpoint = timeLogData.taskId 
        ? API_ENDPOINTS.TASKS.TIME_LOGS(timeLogData.taskId)
        : API_ENDPOINTS.TIME_LOGS.BASE;
      
      return await apiClient.post(endpoint, timeLogData);
    } catch (error) {
      console.error('Create time log error:', error);
      throw error;
    }
  }

  /**
   * Update existing time log
   */
  async updateTimeLog(id: string, timeLogData: UpdateTimeLogRequest): Promise<ApiResponse<TimeLog>> {
    try {
      return await apiClient.put(`${API_ENDPOINTS.TIME_LOGS.BASE}/${id}`, timeLogData);
    } catch (error) {
      console.error('Update time log error:', error);
      throw error;
    }
  }

  /**
   * Delete time log
   */
  async deleteTimeLog(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.TIME_LOGS.BASE}/${id}`);
    } catch (error) {
      console.error('Delete time log error:', error);
      throw error;
    }
  }

  /**
   * Start timer
   */
  async startTimer(params: {
    userId: string;
    taskId?: string;
    projectId: string;
    description: string;
  }): Promise<ApiResponse<{ timerId: string; startTime: string }>> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TIME_LOGS.BASE}/timer/start`, params);
    } catch (error) {
      console.error('Start timer error:', error);
      throw error;
    }
  }

  /**
   * Stop timer
   */
  async stopTimer(params: {
    userId: string;
    timerId?: string;
    description?: string;
  }): Promise<ApiResponse<TimeLog>> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TIME_LOGS.BASE}/timer/stop`, params);
    } catch (error) {
      console.error('Stop timer error:', error);
      throw error;
    }
  }

  /**
   * Get active timer for user
   */
  async getActiveTimer(userId: string): Promise<ApiResponse<{
    timerId: string;
    userId: string;
    taskId?: string;
    projectId: string;
    description: string;
    startTime: string;
    currentDuration: number;
  } | null>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TIME_LOGS.BASE}/timer/active/${userId}`);
    } catch (error) {
      console.error('Get active timer error:', error);
      throw error;
    }
  }

  /**
   * Get user timesheet for date range
   */
  async getUserTimesheet(userId: string, dateRange: { start: string; end: string }): Promise<ApiResponse<{
    timeLogs: TimeLog[];
    totalHours: number;
    billableHours: number;
    byProject: Record<string, { hours: number; billableHours: number }>;
    byDate: Record<string, { hours: number; billableHours: number }>;
  }>> {
    try {
      return await apiClient.get(API_ENDPOINTS.USERS.TIMESHEET(userId), {
        params: dateRange
      });
    } catch (error) {
      console.error('Get user timesheet error:', error);
      throw error;
    }
  }

  /**
   * Approve time log
   */
  async approveTimeLog(id: string, approverId: string): Promise<ApiResponse<TimeLog>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.TIME_LOGS.BASE}/${id}/approve`, { approverId });
    } catch (error) {
      console.error('Approve time log error:', error);
      throw error;
    }
  }

  /**
   * Reject time log approval
   */
  async rejectTimeLog(id: string, reason?: string): Promise<ApiResponse<TimeLog>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.TIME_LOGS.BASE}/${id}/reject`, { reason });
    } catch (error) {
      console.error('Reject time log error:', error);
      throw error;
    }
  }

  /**
   * Get time tracking statistics
   */
  async getTimeStats(params?: {
    userId?: string;
    projectId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<ApiResponse<{
    totalHours: number;
    billableHours: number;
    approvedHours: number;
    pendingHours: number;
    byUser: Record<string, number>;
    byProject: Record<string, number>;
    byDate: Record<string, number>;
    averageHoursPerDay: number;
  }>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.TIME_LOGS.BASE}/stats${queryParams ? `?${queryParams}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get time stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const timeTrackingService = new TimeTrackingService();