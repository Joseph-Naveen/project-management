import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services';
import type { Notification, CreateNotificationRequest, NotificationPreferences } from '../types';
import { useAuthContext } from '../context/AuthContext';

// Query keys for consistent caching
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...notificationQueryKeys.lists(), { filters }] as const,
  details: () => [...notificationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationQueryKeys.details(), id] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
  preferences: (userId: string) => [...notificationQueryKeys.all, 'preferences', userId] as const,
  stats: (userId: string) => [...notificationQueryKeys.all, 'stats', userId] as const,
  byCategory: (category: string) => [...notificationQueryKeys.all, 'category', category] as const,
  byType: (type: string) => [...notificationQueryKeys.all, 'type', type] as const,
  byPriority: (priority: string) => [...notificationQueryKeys.all, 'priority', priority] as const,
};

// Simplified hook for basic notification functionality
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthContext();
  
  const { data, isLoading, error } = useQuery({
    queryKey: notificationQueryKeys.list({}),
    queryFn: async () => {
      const response = await notificationService.getNotifications({});
      return response.data;
    },
    enabled: isAuthenticated && !!user, // Only fetch when authenticated
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Disable retries for cost optimization on Render free tier
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationService.markAsRead(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await notificationService.markAllAsRead(userId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
    },
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};

// Hook for fetching notifications with parameters
export const useNotificationsWithParams = (params?: {
  userId?: string;
  read?: boolean;
  category?: string;
  type?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const { isAuthenticated, user } = useAuthContext();
  
  return useQuery({
    queryKey: notificationQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await notificationService.getNotifications(params);
      return response.data;
    },
    enabled: isAuthenticated && !!user, // Only fetch when authenticated
    staleTime: 30 * 1000, // 30 seconds (notifications change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Disable retries for cost optimization on Render free tier
  });
};

// Hook for fetching a single notification
export const useNotification = (id: string, enabled = true) => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: async () => {
      const response = await notificationService.getNotificationById(id);
      return response.data;
    },
    enabled: enabled && !!id && isAuthenticated, // Only fetch when authenticated
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false, // Disable retries for cost optimization on Render free tier
  });
};

// Hook for fetching unread notification count
export const useUnreadCount = (enabled = true) => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery({
    queryKey: [...notificationQueryKeys.all, 'unread-count'],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response.data;
    },
    enabled: enabled && isAuthenticated, // Only fetch when authenticated
    staleTime: 15 * 1000, // 15 seconds (count changes frequently)
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: false, // Disable automatic refetch to prevent excessive API calls
    retry: false, // Disable retries for cost optimization on Render free tier
  });
};

// Hook for fetching notification preferences
export const useNotificationPreferences = (userId: string, enabled = true) => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery({
    queryKey: notificationQueryKeys.preferences(userId),
    queryFn: async () => {
      const response = await notificationService.getPreferences(userId);
      return response.data;
    },
    enabled: enabled && !!userId && isAuthenticated, // Only fetch when authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes (preferences don't change often)
    retry: false, // Disable retries for cost optimization on Render free tier
  });
};

// Hook for fetching notification statistics
export const useNotificationStats = (userId: string, dateRange?: { start: string; end: string }, enabled = true) => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery({
    queryKey: notificationQueryKeys.stats(userId),
    queryFn: async () => {
      const response = await notificationService.getNotificationStats(userId, dateRange);
      return response.data;
    },
    enabled: enabled && !!userId && isAuthenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Disable retries for cost optimization on Render free tier
  });
};

// Hook for creating a notification (admin/system use)
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationData: CreateNotificationRequest) => {
      const response = await notificationService.createNotification(notificationData);
      return response.data;
    },
    onSuccess: (newNotification) => {
      // Add to cache
      queryClient.setQueryData(notificationQueryKeys.detail(newNotification.id), newNotification);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      // Update unread count
      queryClient.invalidateQueries({ 
        queryKey: notificationQueryKeys.unreadCount() 
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: notificationQueryKeys.stats(newNotification.userId) 
      });
    },
    onError: (error) => {
      console.error('Create notification error:', error);
    }
  });
};

// Hook for marking notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationService.markAsRead(id);
      return response.data;
    },
    onSuccess: (updatedNotification) => {
      // Update notification in cache
      queryClient.setQueryData(notificationQueryKeys.detail(updatedNotification.id), updatedNotification);
      
      // Invalidate lists to show updated read status
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      // Update unread count
      queryClient.invalidateQueries({ 
        queryKey: notificationQueryKeys.unreadCount() 
      });
      
      // Update stats
      queryClient.invalidateQueries({ 
        queryKey: notificationQueryKeys.stats(updatedNotification.userId) 
      });
    },
    onError: (error) => {
      console.error('Mark as read error:', error);
    }
  });
};

// Hook for marking notification as unread
export const useMarkAsUnread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationService.markAsUnread(id);
      return response.data;
    },
    onSuccess: (updatedNotification) => {
      // Update notification in cache
      queryClient.setQueryData(notificationQueryKeys.detail(updatedNotification.id), updatedNotification);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      // Update unread count
      queryClient.invalidateQueries({ 
        queryKey: notificationQueryKeys.unreadCount() 
      });
      
      // Update stats
      queryClient.invalidateQueries({ 
        queryKey: notificationQueryKeys.stats(updatedNotification.userId) 
      });
    },
    onError: (error) => {
      console.error('Mark as unread error:', error);
    }
  });
};

// Hook for marking all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await notificationService.markAllAsRead(userId);
      return response.data;
    },
    onSuccess: (_, userId) => {
      // Invalidate all notification queries for this user
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      // Reset unread count to 0
      queryClient.setQueryData(notificationQueryKeys.unreadCount(), { count: 0 });
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.stats(userId) });
    },
    onError: (error) => {
      console.error('Mark all as read error:', error);
    }
  });
};

// Hook for deleting a notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationService.deleteNotification(id);
      return id;
    },
    onSuccess: (deletedId) => {
      const deletedNotification = queryClient.getQueryData<Notification>(
        notificationQueryKeys.detail(deletedId)
      );
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: notificationQueryKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      // Update unread count if it was unread
      if (deletedNotification && !deletedNotification.read) {
        queryClient.invalidateQueries({ 
          queryKey: notificationQueryKeys.unreadCount() 
        });
      }
      
      // Update stats
      if (deletedNotification) {
        queryClient.invalidateQueries({ 
          queryKey: notificationQueryKeys.stats(deletedNotification.userId) 
        });
      }
    },
    onError: (error) => {
      console.error('Delete notification error:', error);
    }
  });
};

// Hook for deleting all read notifications
export const useDeleteReadNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await notificationService.deleteReadNotifications(userId);
      return response.data;
    },
    onSuccess: (_, userId) => {
      // Invalidate all lists to reflect deletions
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      // Unread count shouldn't change, but refresh just in case
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.stats(userId) });
    },
    onError: (error) => {
      console.error('Delete read notifications error:', error);
    }
  });
};

// Hook for updating notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      preferences 
    }: { 
      userId: string; 
      preferences: Partial<NotificationPreferences> 
    }) => {
      const response = await notificationService.updatePreferences(userId, preferences);
      return response.data;
    },
    onSuccess: (updatedPreferences) => {
      // Update preferences in cache
      queryClient.setQueryData(
        notificationQueryKeys.preferences(updatedPreferences.userId), 
        updatedPreferences
      );
    },
    onError: (error) => {
      console.error('Update notification preferences error:', error);
    }
  });
};

// Hook for notification filtering helpers
export const useNotificationFilters = () => {
  const useUnreadNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'read' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, read: false });
  };

  const useReadNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'read' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, read: true });
  };

  const useTaskNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'category' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, category: 'task' });
  };

  const useMentionNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'category' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, category: 'mention' });
  };

  const useDeadlineNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'category' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, category: 'deadline' });
  };

  const useSystemNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'category' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, category: 'system' });
  };

  const useHighPriorityNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'priority' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, priority: 'high' });
  };

  const useCriticalNotifications = (userId: string, params?: Omit<Parameters<typeof useNotificationsWithParams>[0], 'priority' | 'userId'>) => {
    return useNotificationsWithParams({ ...params, userId, priority: 'critical' });
  };

  return {
    useUnreadNotifications,
    useReadNotifications,
    useTaskNotifications,
    useMentionNotifications,
    useDeadlineNotifications,
    useSystemNotifications,
    useHighPriorityNotifications,
    useCriticalNotifications
  };
};

// Hook for optimistic notification updates
export const useOptimisticNotificationUpdate = () => {
  const queryClient = useQueryClient();

  const markAsReadOptimistically = (id: string) => {
    queryClient.setQueryData(
      notificationQueryKeys.detail(id),
      (old: Notification | undefined) => {
        if (!old) return old;
        return {
          ...old,
          read: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    );

    // Optimistically update unread count
    const notification = queryClient.getQueryData<Notification>(notificationQueryKeys.detail(id));
    if (notification && !notification.read) {
      queryClient.setQueryData(
        notificationQueryKeys.unreadCount(),
        (old: { count: number } | undefined) => {
          if (!old) return old;
          return { count: Math.max(0, old.count - 1) };
        }
      );
    }
  };

  const markAsUnreadOptimistically = (id: string) => {
    queryClient.setQueryData(
      notificationQueryKeys.detail(id),
      (old: Notification | undefined) => {
        if (!old) return old;
        return {
          ...old,
          read: false,
          readAt: null,
          updatedAt: new Date().toISOString()
        };
      }
    );

    // Optimistically update unread count
    const notification = queryClient.getQueryData<Notification>(notificationQueryKeys.detail(id));
    if (notification && notification.read) {
      queryClient.setQueryData(
        notificationQueryKeys.unreadCount(),
        (old: { count: number } | undefined) => {
          if (!old) return { count: 1 };
          return { count: old.count + 1 };
        }
      );
    }
  };

  const revertOptimisticUpdate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.detail(id) });
  };

  return {
    markAsReadOptimistically,
    markAsUnreadOptimistically,
    revertOptimisticUpdate
  };
};

// Hook for bulk notification operations
export const useBulkNotificationOperations = () => {
  const queryClient = useQueryClient();

  const bulkMarkAsRead = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const promises = notificationIds.map(id => notificationService.markAsRead(id));
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedNotifications) => {
      // Update notifications in cache
      updatedNotifications.forEach(notification => {
        queryClient.setQueryData(notificationQueryKeys.detail(notification.id), notification);
      });
      
      // Invalidate lists and counts
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      
      if (updatedNotifications.length > 0) {
        const userId = updatedNotifications[0].userId;
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.stats(userId) });
      }
    },
    onError: (error) => {
      console.error('Bulk mark as read error:', error);
    }
  });

  const bulkDeleteNotifications = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const promises = notificationIds.map(id => notificationService.deleteNotification(id));
      await Promise.all(promises);
      return notificationIds;
    },
    onSuccess: (deletedIds) => {
      // Remove notifications from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: notificationQueryKeys.detail(id) });
      });
      
      // Invalidate lists and counts
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
    onError: (error) => {
      console.error('Bulk delete notifications error:', error);
    }
  });

  return {
    bulkMarkAsRead,
    bulkDeleteNotifications
  };
};

// Hook for real-time notifications (WebSocket/SSE integration)
export const useNotificationRealTime = (userId: string) => {
  const { isAuthenticated } = useAuthContext();

  const subscribeToNotifications = () => {
    // Only subscribe when authenticated
    if (!isAuthenticated || !userId) {
      return;
    }
    
    // TODO: Implement WebSocket or Server-Sent Events subscription
    console.log(`Subscribing to real-time notifications for user ${userId}`);
    
    // Example of how real-time updates would work:
    // const handleNewNotification = (notification: Notification) => {
    //   queryClient.setQueryData(notificationQueryKeys.detail(notification.id), notification);
    //   queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
    //   queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
    //   
    //   // Show toast notification
    //   showToastNotification(notification);
    // };
    // 
    // const handleNotificationRead = (notificationId: string) => {
    //   queryClient.setQueryData(
    //     notificationQueryKeys.detail(notificationId),
    //     (old: Notification | undefined) => {
    //       if (!old) return old;
    //       return { ...old, read: true, readAt: new Date().toISOString() };
    //     }
    //   );
    //   queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
    // };
    // 
    // WebSocketService.subscribe(`user:${userId}:notifications`, handleNewNotification);
    // WebSocketService.subscribe(`user:${userId}:notification-read`, handleNotificationRead);
  };

  const unsubscribeFromNotifications = () => {
    // TODO: Implement WebSocket unsubscription
    console.log(`Unsubscribing from real-time notifications for user ${userId}`);
  };

  const sendRealTimeNotification = useMutation({
    mutationFn: async (notification: CreateNotificationRequest) => {
      await notificationService.sendRealTimeNotification(notification);
      return notification;
    },
    onError: (error) => {
      console.error('Send real-time notification error:', error);
    }
  });

  return {
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendRealTimeNotification
  };
};

// Hook for notification preferences helpers
export const useNotificationPreferencesHelpers = () => {
  const isNotificationEnabled = (
    preferences: NotificationPreferences | undefined,
    category: string,
    channel: 'email' | 'push' | 'inApp'
  ): boolean => {
    if (!preferences) return true; // Default to enabled if no preferences

    // Check global setting first
    if (!preferences[`${channel}Notifications` as keyof NotificationPreferences]) {
      return false;
    }

    // Check category-specific setting
    const categoryPrefs = preferences.categories?.[category as keyof typeof preferences.categories];
    if (!categoryPrefs) return true; // Default to enabled if no category setting

    return (categoryPrefs as unknown as Record<string, boolean>)[channel] ?? true;
  };

  const isInQuietHours = (preferences: NotificationPreferences | undefined): boolean => {
    if (!preferences?.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    const { startTime, end } = preferences.quietHours;
    
    // Handle same-day quiet hours
    if (startTime && startTime <= end) {
      return currentTime >= startTime && currentTime <= end;
    }
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    return startTime ? (currentTime >= startTime || currentTime <= end) : false;
  };

  const shouldShowImmediate = (): boolean => {
    // Frequency property doesn't exist in NotificationPreferences, so default to true
    return true;
  };

  return {
    isNotificationEnabled,
    isInQuietHours,
    shouldShowImmediate
  };
};

// Hook for notification prefetching
export const usePrefetchNotifications = () => {
  const queryClient = useQueryClient();

  const prefetchNotifications = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: notificationQueryKeys.list({ userId }),
      queryFn: async () => {
        const response = await notificationService.getNotifications({ userId });
        return response.data;
      },
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  const prefetchUnreadCount = () => {
    queryClient.prefetchQuery({
      queryKey: [...notificationQueryKeys.all, 'unread-count'],
      queryFn: async () => {
        const response = await notificationService.getUnreadCount();
        return response.data;
      },
      staleTime: 15 * 1000, // 15 seconds
    });
  };

  const prefetchPreferences = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: notificationQueryKeys.preferences(userId),
      queryFn: async () => {
        const response = await notificationService.getPreferences(userId);
        return response.data;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  return {
    prefetchNotifications,
    prefetchUnreadCount,
    prefetchPreferences
  };
};
