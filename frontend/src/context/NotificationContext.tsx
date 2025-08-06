import React, { createContext, useContext, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import type { ToastOptions, Id as ToastId } from 'react-toastify';
import { useNotifications, useUnreadCount, useNotificationRealTime } from '../hooks/useNotifications';
import { useAuthContext } from './AuthContext';
import type { Notification, NotificationPreferences } from '../types';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

// Notification context interface
interface NotificationContextType {
  // Toast notifications
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => ToastId;
  showSuccess: (message: string, options?: ToastOptions) => ToastId;
  showError: (message: string, options?: ToastOptions) => ToastId;
  showWarning: (message: string, options?: ToastOptions) => ToastId;
  showInfo: (message: string, options?: ToastOptions) => ToastId;
  dismissToast: (toastId: ToastId) => void;
  dismissAllToasts: () => void;
  
  // In-app notifications
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  isLoadingUnreadCount: boolean;
  
  // Real-time capabilities
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  
  // Notification preferences
  preferences: NotificationPreferences | undefined;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  
  // Utility methods
  playNotificationSound: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  showBrowserNotification: (title: string, options?: NotificationOptions) => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Props for the NotificationProvider
interface NotificationProviderProps {
  children: ReactNode;
  maxToasts?: number;
  defaultToastOptions?: ToastOptions;
  enableBrowserNotifications?: boolean;
  enableSound?: boolean;
}

// NotificationProvider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxToasts = 5,
  defaultToastOptions = {},
  enableBrowserNotifications = true,
  enableSound = true
}) => {
  const { user, isAuthenticated } = useAuthContext();
  
  // Fetch in-app notifications - only when authenticated and user is loaded
  const {
    notifications: notificationList,
    unreadCount: notificationUnreadCount,
    isLoading: isLoadingNotifications
  } = useNotifications();

  // Fetch unread count - only when authenticated and user is loaded
  const {
    data: unreadData,
    isLoading: isLoadingUnreadCount
  } = useUnreadCount(isAuthenticated && !!user?.id);

  // Real-time notifications - only when authenticated and user is loaded
  const realTimeNotifications = useNotificationRealTime(user?.id || '');

  const notifications = notificationList || [];
  const unreadCount = notificationUnreadCount || unreadData?.count || 0;

  // Toast notification methods
  const showToast = useCallback((
    message: string,
    type: ToastType = 'default',
    options: ToastOptions = {}
  ): ToastId => {
    const toastOptions: ToastOptions = {
      ...defaultToastOptions,
      ...options,
      type: type === 'default' ? undefined : type,
    };

    return toast(message, toastOptions);
  }, [defaultToastOptions]);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const dismissToast = useCallback((toastId: ToastId) => {
    toast.dismiss(toastId);
  }, []);

  const dismissAllToasts = useCallback(() => {
    toast.dismiss();
  }, []);

  // Browser notification methods
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  const showBrowserNotification = useCallback((
    title: string,
    options: NotificationOptions = {}
  ) => {
    if (!enableBrowserNotifications || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon-192x192.png',
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click events
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to notification URL if provided
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };
    }
  }, [enableBrowserNotifications]);

  // Sound notification
  const playNotificationSound = useCallback(() => {
    if (!enableSound) return;

    try {
      // Create audio element and play notification sound
      const audio = new Audio('/notification.mp3'); // You'd need to add this file
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Notification sound not available:', error);
    }
  }, [enableSound]);

  // Handle new notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Process new notifications and show appropriate UI feedback
    notifications.forEach((notification: Notification) => {
      if (!notification.read && notification.createdAt) {
        const notificationTime = new Date(notification.createdAt).getTime();
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        // Only show toast for recent notifications (within 5 minutes)
        if (notificationTime > fiveMinutesAgo) {
          const toastMessage = `${notification.title}: ${notification.message}`;
          
          // Choose toast type based on notification priority/category
          let toastType: ToastType = 'info';
          if (notification.priority === 'high' || notification.priority === 'critical') {
            toastType = 'warning';
          }
          if (notification.category === 'system') {
            toastType = 'info';
          }
          if (notification.type.includes('error') || notification.type.includes('failed')) {
            toastType = 'error';
          }
          if (notification.type.includes('success') || notification.type.includes('completed')) {
            toastType = 'success';
          }

          showToast(toastMessage, toastType, {
            autoClose: 5000,
            closeOnClick: true,
            onClick: () => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }
          });

          // Show browser notification
          if (enableBrowserNotifications && Notification.permission === 'granted') {
            showBrowserNotification(notification.title, {
              body: notification.message,
              tag: notification.id,
              data: { url: notification.actionUrl }
            });
          }

          // Play sound
          playNotificationSound();
        }
      }
    });
  }, [
    notifications,
    isAuthenticated,
    user,
    showToast,
    showBrowserNotification,
    playNotificationSound,
    enableBrowserNotifications
  ]);

  // Real-time subscription management
  const subscribeToNotifications = useCallback(() => {
    if (user) {
      realTimeNotifications.subscribeToNotifications();
    }
  }, [realTimeNotifications, user]);

  const unsubscribeFromNotifications = useCallback(() => {
    realTimeNotifications.unsubscribeFromNotifications();
  }, [realTimeNotifications]);

  // Auto-subscribe to real-time notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      subscribeToNotifications();
      
      return () => {
        unsubscribeFromNotifications();
      };
    }
  }, [isAuthenticated, user, subscribeToNotifications, unsubscribeFromNotifications]);

  // Request notification permission on mount if enabled
  useEffect(() => {
    if (enableBrowserNotifications && isAuthenticated) {
      requestNotificationPermission();
    }
  }, [enableBrowserNotifications, isAuthenticated, requestNotificationPermission]);

  // Handle visibility change to mark notifications as read when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && unreadCount > 0) {
        // User returned to the app, could auto-mark some notifications as read
        // This is optional and depends on your UX requirements
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [unreadCount]);

  // Preferences management (simplified for now)
  const preferences = undefined; // Would be fetched via useNotificationPreferences hook
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    // Would use the updateNotificationPreferences mutation
    console.log('Updating notification preferences:', prefs);
  }, []);

  const contextValue: NotificationContextType = {
    // Toast methods
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAllToasts,
    
    // In-app notifications
    notifications,
    unreadCount,
    isLoadingNotifications,
    isLoadingUnreadCount,
    
    // Real-time
    subscribeToNotifications,
    unsubscribeFromNotifications,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Utility methods
    playNotificationSound,
    requestNotificationPermission,
    showBrowserNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={maxToasts}
        theme="colored"
        className="notification-toast-container"
      />
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
};

// Higher-order component for notification-aware components
export const withNotifications = <P extends object>(
  Component: React.ComponentType<P & { notifications: NotificationContextType }>
) => {
  const NotificationAwareComponent = (props: P) => {
    const notifications = useNotificationContext();
    return <Component {...props} notifications={notifications} />;
  };

  NotificationAwareComponent.displayName = `withNotifications(${Component.displayName || Component.name})`;
  
  return NotificationAwareComponent;
};

// Component for conditional notification rendering
interface NotificationGuardProps {
  children: ReactNode;
  showWhenUnread?: boolean;
  minUnreadCount?: number;
  fallback?: ReactNode;
}

export const NotificationGuard: React.FC<NotificationGuardProps> = ({
  children,
  showWhenUnread = false,
  minUnreadCount = 1,
  fallback = null
}) => {
  const { unreadCount } = useNotificationContext();

  if (showWhenUnread && unreadCount >= minUnreadCount) {
    return <>{children}</>;
  }

  if (!showWhenUnread) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Hook for notification badge/indicator
export const useNotificationBadge = () => {
  const { unreadCount } = useNotificationContext();

  const shouldShowBadge = unreadCount > 0;
  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();
  const badgeColor = unreadCount > 10 ? 'red' : unreadCount > 5 ? 'orange' : 'blue';

  return {
    shouldShowBadge,
    badgeText,
    badgeColor,
    unreadCount
  };
};

// Hook for notification management actions
export const useNotificationActions = () => {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    dismissAllToasts,
    playNotificationSound,
    requestNotificationPermission 
  } = useNotificationContext();

  // Convenience methods for common notification patterns
  const notifySuccess = useCallback((action: string, entity?: string) => {
    const message = entity ? `${entity} ${action} successfully` : `${action} completed successfully`;
    showSuccess(message);
  }, [showSuccess]);

  const notifyError = useCallback((action: string, error?: string, entity?: string) => {
    const message = entity 
      ? `Failed to ${action} ${entity}${error ? `: ${error}` : ''}`
      : `${action} failed${error ? `: ${error}` : ''}`;
    showError(message);
  }, [showError]);

  const notifyWarning = useCallback((message: string) => {
    showWarning(message);
  }, [showWarning]);

  const notifyInfo = useCallback((message: string) => {
    showInfo(message);
  }, [showInfo]);

  // Common CRUD notifications
  const notifyCreated = useCallback((entity: string) => notifySuccess('created', entity), [notifySuccess]);
  const notifyUpdated = useCallback((entity: string) => notifySuccess('updated', entity), [notifySuccess]);
  const notifyDeleted = useCallback((entity: string) => notifySuccess('deleted', entity), [notifySuccess]);
  const notifySaved = useCallback((entity?: string) => notifySuccess('saved', entity), [notifySuccess]);

  const notifyCreateFailed = useCallback((entity: string, error?: string) => 
    notifyError('create', error, entity), [notifyError]);
  const notifyUpdateFailed = useCallback((entity: string, error?: string) => 
    notifyError('update', error, entity), [notifyError]);
  const notifyDeleteFailed = useCallback((entity: string, error?: string) => 
    notifyError('delete', error, entity), [notifyError]);
  const notifySaveFailed = useCallback((entity: string, error?: string) => 
    notifyError('save', error, entity), [notifyError]);

  return {
    // Basic notifications
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    
    // CRUD notifications
    notifyCreated,
    notifyUpdated,
    notifyDeleted,
    notifySaved,
    notifyCreateFailed,
    notifyUpdateFailed,
    notifyDeleteFailed,
    notifySaveFailed,
    
    // Utility actions
    dismissAllToasts,
    playNotificationSound,
    requestNotificationPermission
  };
};