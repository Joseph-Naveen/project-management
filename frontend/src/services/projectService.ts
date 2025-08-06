import { apiClient } from './apiClient'
import type { ApiResponse } from './apiClient'
import { API_ENDPOINTS } from '../constants'
import type { Project, CreateProjectRequest, UpdateProjectRequest, ProjectMember } from '../types'

// Project Service class
class ProjectService {
  /**
   * Get all projects with optional filtering
   */
  async getProjects(params?: {
    status?: string
    priority?: string
    ownerId?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ projects: Project[]; total: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams(params as Record<string, string>).toString()
      const url = `${API_ENDPOINTS.PROJECTS.BASE}${queryParams ? `?${queryParams}` : ''}`

      return await apiClient.get(url)
    } catch (error) {
      console.error('Get projects error:', error)
      throw error
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    try {
      return await apiClient.get(API_ENDPOINTS.PROJECTS.BY_ID(id))
    } catch (error) {
      console.error('Get project by ID error:', error)
      throw error
    }
  }

  /**
   * Create new project
   */
  async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<Project>> {
    try {
      return await apiClient.post(API_ENDPOINTS.PROJECTS.BASE, projectData)
    } catch (error) {
      console.error('Create project error:', error)
      throw error
    }
  }

  /**
   * Update existing project
   */
  async updateProject(
    id: string,
    projectData: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> {
    try {
      return await apiClient.put(API_ENDPOINTS.PROJECTS.BY_ID(id), projectData)
    } catch (error) {
      console.error('Update project error:', error)
      throw error
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(API_ENDPOINTS.PROJECTS.BY_ID(id))
    } catch (error) {
      console.error('Delete project error:', error)
      throw error
    }
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string): Promise<ApiResponse<ProjectMember[]>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/members`)
    } catch (error) {
      console.error('Get project members error:', error)
      throw error
    }
  }

  /**
   * Add member to project
   */
  async addProjectMember(
    projectId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'viewer' = 'member'
  ): Promise<ApiResponse<ProjectMember>> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/members`, {
        userId,
        role,
      })
    } catch (error) {
      console.error('Add project member error:', error)
      throw error
    }
  }

  /**
   * Remove member from project
   */
  async removeProjectMember(projectId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/members/${userId}`)
    } catch (error) {
      console.error('Remove project member error:', error)
      throw error
    }
  }

  /**
   * Update project member role
   */
  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'viewer'
  ): Promise<ApiResponse<ProjectMember>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/members/${userId}`, {
        role,
      })
    } catch (error) {
      console.error('Update project member role error:', error)
      throw error
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<
    ApiResponse<{
      totalTasks: number
      completedTasks: number
      overdueTasks: number
      totalHours: number
      progress: number
      membersCount: number
    }>
  > {
    try {
      return await apiClient.get(`${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/stats`)
    } catch (error) {
      console.error('Get project stats error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService()
