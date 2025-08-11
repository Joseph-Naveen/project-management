import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  averageCompletion: number;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalHoursLogged: number;
  averageHoursPerMember: number;
}

export interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  status: string;
  dueDate: string;
}

export interface TeamPerformance {
  id: string;
  name: string;
  tasksCompleted: number;
  hoursLogged: number;
  efficiency: number;
}

export interface TimeDistribution {
  category: string;
  hours: number;
  percentage: number;
}

export interface ReportParams {
  timeRange?: string;
  projectId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  format?: 'pdf' | 'excel' | 'csv';
}

export interface ExportParams {
  type: 'projects' | 'teams' | 'users';
  format: 'pdf' | 'excel' | 'csv';
  filters?: Record<string, unknown>;
}

class ReportsService {
  /**
   * Get project reports
   */
  async getProjectReports(params: ReportParams = {}): Promise<ApiResponse<{
    projects: Array<{
      id: string;
      name: string;
      status: string;
      priority: string;
      owner: { id: string; name: string; email: string };
      progress: number;
      stats: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        pendingTasks: number;
        completionRate: number;
        overdueTasks?: number;
      };
      createdAt: string;
      updatedAt: string;
    }>;
    summary: {
      totalProjects: number;
      activeProjects: number;
      completedProjects: number;
      avgCompletionRate: number;
      overdueProjects?: number;
      onHoldProjects?: number;
    };
  }>> {
    try {
      const response = await apiClient.get<{
        projects: Array<{
          id: string;
          name: string;
          status: string;
          priority: string;
          owner: { id: string; name: string; email: string };
          progress: number;
          stats: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            pendingTasks: number;
            completionRate: number;
            overdueTasks?: number;
          };
          createdAt: string;
          updatedAt: string;
        }>;
        summary: {
          totalProjects: number;
          activeProjects: number;
          completedProjects: number;
          avgCompletionRate: number;
          overdueProjects?: number;
          onHoldProjects?: number;
        };
      }>('/reports/projects', { params });
      return {
        success: true,
        data: response.data,
        message: 'Project reports fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch project reports'],
        data: null as any
      };
    }
  }

  /**
   * Get team reports
   */
  async getTeamReports(params: ReportParams = {}): Promise<ApiResponse<{
    teams: Array<{
      id: string;
      name: string;
      description: string;
      manager: { id: string; name: string; email: string };
      memberCount: number;
      projectCount: number;
      stats: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        pendingTasks: number;
        completionRate: number;
      };
      createdAt: string;
      updatedAt: string;
    }>;
    summary: {
      totalTeams: number;
      totalMembers: number;
      avgCompletionRate: number;
    };
  }>> {
    try {
      const response = await apiClient.get<{
        teams: Array<{
          id: string;
          name: string;
          description: string;
          manager: { id: string; name: string; email: string };
          memberCount: number;
          projectCount: number;
          stats: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            pendingTasks: number;
            completionRate: number;
          };
          createdAt: string;
          updatedAt: string;
        }>;
        summary: {
          totalTeams: number;
          totalMembers: number;
          avgCompletionRate: number;
        };
      }>('/reports/teams', { params });
      return {
        success: true,
        data: response.data,
        message: 'Team reports fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch team reports'],
        data: null as any
      };
    }
  }

  /**
   * Get time tracking reports
   */
  async getTimeReports(params: ReportParams = {}): Promise<ApiResponse<{
    totalHours: number;
    distribution: TimeDistribution[];
    byProject: Array<{ projectId: string; projectName: string; hours: number }>;
    byUser: Array<{ userId: string; userName: string; hours: number }>;
  }>> {
    try {
      const response = await apiClient.get<{
        totalHours: number;
        distribution: TimeDistribution[];
        byProject: Array<{ projectId: string; projectName: string; hours: number }>;
        byUser: Array<{ userId: string; userName: string; hours: number }>;
      }>('/reports/time', { params });
      return {
        success: true,
        data: response.data,
        message: 'Time reports fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch time reports'],
        data: null as any
      };
    }
  }

  /**
   * Export report data
   */
  async exportReport(params: ExportParams): Promise<ApiResponse<Blob>> {
    try {
      const response = await apiClient.get<Blob>('/reports/export', { 
        params,
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        message: 'Report exported successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to export report'],
        data: null as any
      };
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<{
    totalProjects: number;
    activeProjects: number;
    completedTasks: number;
    pendingTasks: number;
    totalHours: number;
    teamMembers: number;
  }>> {
    try {
      const response = await apiClient.get<{
        totalProjects: number;
        activeProjects: number;
        completedTasks: number;
        pendingTasks: number;
        totalHours: number;
        teamMembers: number;
      }>(API_ENDPOINTS.DASHBOARD.STATS);
      return {
        success: true,
        data: response.data,
        message: 'Dashboard stats fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch dashboard stats'],
        data: null as any
      };
    }
  }

  /**
   * Get recent projects for dashboard
   */
  async getRecentProjects(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    dueDate: string;
    team: string[];
  }>>> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        name: string;
        status: string;
        progress: number;
        dueDate: string;
        team: string[];
      }>>(API_ENDPOINTS.DASHBOARD.RECENT_PROJECTS);
      return {
        success: true,
        data: response.data,
        message: 'Recent projects fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch recent projects'],
        data: null as any
      };
    }
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    user: string;
  }>>> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        type: string;
        message: string;
        time: string;
        user: string;
      }>>(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY);
      return {
        success: true,
        data: response.data,
        message: 'Recent activity fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch recent activity'],
        data: null as any
      };
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(): Promise<ApiResponse<{
    totalMembers: number;
    activeMembers: number;
    totalHoursLogged: number;
    averageHoursPerMember: number;
  }>> {
    try {
      const response = await apiClient.get<{
        totalMembers: number;
        activeMembers: number;
        totalHoursLogged: number;
        averageHoursPerMember: number;
      }>('/api/team/stats');
      return {
        success: true,
        data: response.data,
        message: 'Team stats fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch team stats'],
        data: null as any
      };
    }
  }

  /**
   * Get user reports
   */
  async getUserReports(params: ReportParams = {}): Promise<ApiResponse<{
    stats: {
      totalUsers: number;
      activeUsers: number;
      totalTasks: number;
      totalHours: number;
      billableHours?: number;
      avgCompletionRate: number;
    };
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      jobTitle: string;
      projectCount: number;
      stats: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        pendingTasks: number;
        completionRate: number;
        overdueTasks?: number;
        totalHours?: number;
        billableHours?: number;
      };
      createdAt: string;
    }>;
  }>> {
    try {
      const response = await apiClient.get<{
        stats: {
          totalUsers: number;
          activeUsers: number;
          totalTasks: number;
          totalHours: number;
          billableHours?: number;
          avgCompletionRate: number;
        };
        users: Array<{
          id: string;
          name: string;
          email: string;
          role: string;
          department: string;
          jobTitle: string;
          projectCount: number;
          stats: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            pendingTasks: number;
            completionRate: number;
            overdueTasks?: number;
            totalHours?: number;
            billableHours?: number;
          };
          createdAt: string;
        }>;
      }>('/reports/users', { params });
      return {
        success: true,
        data: response.data,
        message: 'User reports fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch user reports'],
        data: null as any
      };
    }
  }
}

export const reportsService = new ReportsService(); 