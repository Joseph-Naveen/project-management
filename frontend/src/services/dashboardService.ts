import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';

// Dashboard Service class
class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<{
    stats: {
      totalProjects: number;
      activeProjects: number;
      completedTasks: number;
      totalTasks: number;
      totalUsers: number;
      totalTimeThisWeek: number;
      tasksByStatus: Array<{ status: string; count: number }>;
      projectsByStatus: Array<{ status: string; count: number }>;
    };
  }>> {
    try {
      return await apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  /**
   * Get recent projects
   */
  async getRecentProjects(limit: number = 5): Promise<ApiResponse<{
    projects: Array<{
      id: string;
      name: string;
      description: string;
      status: string;
      priority: string;
      progress: number;
      owner: {
        id: string;
        name: string;
        email: string;
        avatar: string;
      };
      createdAt: string;
      updatedAt: string;
    }>;
  }>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.DASHBOARD.RECENT_PROJECTS}?limit=${limit}`);
    } catch (error) {
      console.error('Get recent projects error:', error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<ApiResponse<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      entityId: string;
      entityType: string;
      actorId: string;
      actor: {
        id: string;
        name: string;
        avatar: string;
      };
      createdAt: string;
    }>;
  }>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY}?limit=${limit}`);
    } catch (error) {
      console.error('Get recent activity error:', error);
      throw error;
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(): Promise<ApiResponse<{
    assignedTasks: number;
    completedTasks: number;
    timeThisWeek: number;
    userProjects: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
      owner: {
        id: string;
        name: string;
        email: string;
        avatar: string;
      };
    }>;
    recentTimeLogs: Array<{
      id: string;
      description: string;
      duration: number;
      date: string;
      task: {
        id: string;
        title: string;
      };
      project: {
        id: string;
        name: string;
      };
    }>;
  }>> {
    try {
      return await apiClient.get(API_ENDPOINTS.DASHBOARD.USER_DASHBOARD);
    } catch (error) {
      console.error('Get user dashboard error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService(); 