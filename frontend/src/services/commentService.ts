import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types';

// Comment Service class
class CommentService {
  /**
   * Get comments for a task or project
   */
  async getComments(params: {
    taskId?: string;
    projectId?: string;
    parentId?: string | null;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ comments: Comment[]; total: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.COMMENTS.BASE}${queryParams ? `?${queryParams}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  /**
   * Get comment by ID
   */
  async getCommentById(id: string): Promise<ApiResponse<Comment>> {
    try {
      return await apiClient.get(API_ENDPOINTS.COMMENTS.BY_ID(id));
    } catch (error) {
      console.error('Get comment by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new comment
   */
  async createComment(commentData: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    try {
      const endpoint = commentData.taskId 
        ? API_ENDPOINTS.TASKS.COMMENTS(commentData.taskId)
        : commentData.projectId 
        ? API_ENDPOINTS.PROJECTS.COMMENTS(commentData.projectId)
        : API_ENDPOINTS.COMMENTS.BASE;
      
      return await apiClient.post(endpoint, commentData);
    } catch (error) {
      console.error('Create comment error:', error);
      throw error;
    }
  }

  /**
   * Update existing comment
   */
  async updateComment(id: string, commentData: UpdateCommentRequest): Promise<ApiResponse<Comment>> {
    try {
      return await apiClient.put(API_ENDPOINTS.COMMENTS.BY_ID(id), commentData);
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(API_ENDPOINTS.COMMENTS.BY_ID(id));
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }

  /**
   * Add reaction to comment
   */
  async addReaction(commentId: string, emoji: string): Promise<ApiResponse<Comment>> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.COMMENTS.BY_ID(commentId)}/reactions`, { emoji });
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from comment
   */
  async removeReaction(commentId: string, emoji: string): Promise<ApiResponse<Comment>> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.COMMENTS.BY_ID(commentId)}/reactions/${encodeURIComponent(emoji)}`);
    } catch (error) {
      console.error('Remove reaction error:', error);
      throw error;
    }
  }

  /**
   * Get comments by task
   */
  async getTaskComments(taskId: string, params?: {
    parentId?: string | null;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Comment[]>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.TASKS.COMMENTS(taskId)}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiClient.get<{ comments: Comment[]; total: number; page: number; limit: number }>(url);
      return {
        ...response,
        data: response.data.comments
      };
    } catch (error) {
      console.error('Get task comments error:', error);
      throw error;
    }
  }

  /**
   * Get comments by project
   */
  async getProjectComments(projectId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Comment[]>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.PROJECTS.COMMENTS(projectId)}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiClient.get<{ comments: Comment[]; total: number; page: number; limit: number }>(url);
      return {
        ...response,
        data: response.data.comments
      };
    } catch (error) {
      console.error('Get project comments error:', error);
      throw error;
    }
  }

  /**
   * Get comment thread (parent comment with all replies)
   */
  async getCommentThread(commentId: string): Promise<ApiResponse<Comment>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.COMMENTS.BY_ID(commentId)}/thread`);
    } catch (error) {
      console.error('Get comment thread error:', error);
      throw error;
    }
  }

  /**
   * Search comments
   */
  async searchComments(params: {
    query: string;
    taskId?: string;
    projectId?: string;
    authorId?: string;
    dateRange?: { start: string; end: string };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ comments: Comment[]; total: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.COMMENTS.BASE}/search?${queryParams}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Search comments error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const commentService = new CommentService();