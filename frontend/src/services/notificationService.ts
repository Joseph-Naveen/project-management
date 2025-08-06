import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { Notification, CreateNotificationRequest, NotificationPreferences } from '../types';

// Notification Service class
class NotificationService {
  /**
   * Get notifications for a user
   */
  async getNotifications(params?: {
    userId?: string;
    read?: boolean;
    category?: string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ notifications: Notification[]; total: number; unreadCount: number; page: number; limit: number }>> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.NOTIFICATIONS.BASE}${queryParams ? `?${queryParams}` : ''}`;
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<ApiResponse<Notification>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`);
    } catch (error) {
      console.error('Get notification by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new notification (admin/system use)
   */
  async createNotification(notificationData: CreateNotificationRequest): Promise<ApiResponse<Notification>> {
    try {
      return await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.BASE, notificationData);
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}/read`);
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(id: string): Promise<ApiResponse<Notification>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}/unread`);
    } catch (error) {
      console.error('Mark as unread error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/read-all`, { userId });
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`);
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteReadNotifications(userId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/read`, {
        data: { userId }
      });
    } catch (error) {
      console.error('Delete read notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/unread-count`);
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<ApiResponse<NotificationPreferences>> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/preferences/${userId}`);
    } catch (error) {
      console.error('Get preferences error:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
    try {
      return await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/preferences/${userId}`, preferences);
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification (WebSocket/Server-Sent Events)
   */
  async sendRealTimeNotification(notification: CreateNotificationRequest): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/send`, notification);
    } catch (error) {
      console.error('Send real-time notification error:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string, dateRange?: { start: string; end: string }): Promise<ApiResponse<{
    total: number;
    read: number;
    unread: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }>> {
    try {
      const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
      return await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/stats/${userId}${params}`);
    } catch (error) {
      console.error('Get notification stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();