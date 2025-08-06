import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { User, UpdateUserRequest, UserProfile, TeamMember } from '../types';

// User Service class
class UserService {
  /**
   * Get all users with optional filtering
   */
  async getUsers(params?: {
    role?: string;
    department?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ users: User[]; total: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = `${API_ENDPOINTS.USERS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      return await apiClient.get(API_ENDPOINTS.USERS.BY_ID(id));
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    department?: string;
    jobTitle?: string;
    phone?: string;
  }): Promise<ApiResponse<User>> {
    try {
      return await apiClient.post(API_ENDPOINTS.USERS.BASE, userData);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      return await apiClient.put(API_ENDPOINTS.USERS.BY_ID(id), userData);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      return await apiClient.put(API_ENDPOINTS.USERS.PROFILE, userData);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(id: string): Promise<ApiResponse<User>> {
    try {
      return await apiClient.patch(API_ENDPOINTS.USERS.BY_ID(id), { isActive: false });
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<ApiResponse<User>> {
    try {
      return await apiClient.patch(API_ENDPOINTS.USERS.BY_ID(id), { isActive: true });
    } catch (error) {
      console.error('Activate user error:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: 'admin' | 'manager' | 'developer' | 'qa' | 'owner' | 'member'): Promise<ApiResponse<User>> {
    try {
      return await apiClient.patch(API_ENDPOINTS.USERS.BY_ID(id), { role });
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  /**
   * Get team members for a project
   */
  async getTeamMembers(projectId?: string): Promise<ApiResponse<TeamMember[]>> {
    try {
      const url = projectId 
        ? `${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/members`
        : `${API_ENDPOINTS.USERS.BASE}/team-members`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get team members error:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<ApiResponse<User[]>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.USERS.BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Get user profile with additional details
   */
  async getUserProfile(id: string): Promise<ApiResponse<UserProfile>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.USERS.BY_ID(id)}/profile`);
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user avatar
   */
  async updateUserAvatar(id: string, avatarFile: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    try {
      return await apiClient.uploadFile(`${API_ENDPOINTS.USERS.BY_ID(id)}/avatar`, avatarFile);
    } catch (error) {
      console.error('Update user avatar error:', error);
      throw error;
    }
  }

  /**
   * Get users by department
   */
  async getUsersByDepartment(department: string): Promise<ApiResponse<User[]>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.USERS.BASE}?department=${encodeURIComponent(department)}`);
    } catch (error) {
      console.error('Get users by department error:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<ApiResponse<User[]>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.USERS.BASE}?role=${role}`);
    } catch (error) {
      console.error('Get users by role error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ApiResponse<{
    totalProjects: number;
    activeProjects: number;
    completedTasks: number;
    pendingTasks: number;
    totalHoursLogged: number;
    averageTaskCompletionTime: number;
  }>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.USERS.BY_ID(userId)}/stats`);
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.delete(API_ENDPOINTS.USERS.BY_ID(id));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();