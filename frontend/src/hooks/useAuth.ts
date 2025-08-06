import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService, TokenManager } from '../services';
import type { User, LoginRequest, RegisterRequest } from '../types';

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth hook return type
export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoginLoading: boolean;
  isRegisterLoading: boolean;
  isLogoutLoading: boolean;
}

// Custom hook for authentication management
export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Get current user query
  const {
    data: currentUser,
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response.data;
    },
    enabled: authState.isAuthenticated && TokenManager.getAccessToken() !== null,
    retry: false, // Disable retries for cost optimization on Render free tier
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authService.login(credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Immediately set auth state with complete user data
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      // No need to refetch immediately - we have fresh data
    },
    onError: (error: Error) => {
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: error.message || 'Login failed'
      }));
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await authService.register(userData);
      return response.data;
    },
    onSuccess: (data) => {
      setAuthState(prev => ({
        ...prev,
        user: data.user,
        isAuthenticated: true,
        error: null
      }));
      // Refetch user data to ensure it's up to date
      refetchUser();
    },
    onError: (error: Error) => {
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: error.message || 'Registration failed'
      }));
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      // Clear React Query cache
      window.location.href = '/login';
    },
    onError: () => {
      // Still logout locally even if server request fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      window.location.href = '/login';
    }
  });

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      console.log('[useAuth] Attempting token refresh...');
      await authService.refreshToken();
      // Refetch user data after token refresh
      await refetchUser();
      console.log('[useAuth] Token refresh successful');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Token refresh failed:', errorMessage);
      // Clear tokens and redirect to login
      TokenManager.clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.'
      });
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [refetchUser]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuth = authService.isAuthenticated();
        console.log('[useAuth] Initializing auth, token exists:', isAuth);
        
        if (isAuth) {
          // Set authenticated state immediately to prevent login redirect
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: true
          }));
          
          // Try to get user from token first (for faster UI)
          const userFromToken = authService.getCurrentUserFromToken();
          if (userFromToken) {
            setAuthState(prev => ({
              ...prev,
              user: userFromToken,
              isAuthenticated: true,
              isLoading: false
            }));
          }
          
          // The useQuery will handle fetching fresh user data from server
          // and will be enabled now that isAuthenticated is true
        } else {
          // No authentication token found
          console.log('[useAuth] No auth token found, setting unauthenticated state');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication initialization failed'
        });
      }
    };

    initializeAuth();
  }, []);

  // Update auth state when user query data changes
  useEffect(() => {
    console.log('[useAuth] User query data changed:', { currentUser, userError, isUserLoading });
    
    if (currentUser && !userError) {
      console.log('[useAuth] Setting user from query:', currentUser);
      setAuthState(prev => ({
        ...prev,
        user: currentUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));
    } else if (userError && authState.isAuthenticated) {
      console.log('[useAuth] User query error while authenticated:', userError);
      // Only try refresh if we think we're authenticated but getting an error
      const errorStatus = userError && typeof userError === 'object' && 'response' in userError
        ? (userError as { response: { status: number } }).response?.status
        : null;
      
      if (errorStatus === 401) {
        // Token is invalid, try refresh or logout
        refreshToken();
      }
    } else if (!isUserLoading && authState.isAuthenticated && !currentUser) {
      // We think we're authenticated but have no user data and loading is done
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [currentUser, userError, isUserLoading, refreshToken, authState.isAuthenticated]);

  // Token expiration handler
  useEffect(() => {
    const handleTokenExpiration = () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.'
      });
    };

    // Listen for token expiration events (could be dispatched by API client)
    window.addEventListener('token-expired', handleTokenExpiration);
    
    return () => {
      window.removeEventListener('token-expired', handleTokenExpiration);
    };
  }, []);

  // Auto token refresh
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      const token = TokenManager.getAccessToken();
      if (token) {
        // In a real app, you'd decode the JWT to check expiration
        // For now, refresh every 30 minutes if authenticated
        refreshToken();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated, refreshToken]);

  // Helper functions
  const login = async (credentials: LoginRequest): Promise<void> => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));
  }, []);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading || isUserLoading,
    error: authState.error,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateUser,
    
    // Loading states for individual actions
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
};

// Hook for checking specific permissions
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = useCallback((role: string): boolean => {
    return isAuthenticated && user?.role === role;
  }, [isAuthenticated, user?.role]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return isAuthenticated && user?.role ? roles.includes(user.role) : false;
  }, [isAuthenticated, user?.role]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isProjectManager = useCallback((): boolean => {
    return hasAnyRole(['admin', 'manager']);
  }, [hasAnyRole]);

  const canManageProjects = useCallback((): boolean => {
    return hasAnyRole(['admin', 'manager']);
  }, [hasAnyRole]);

  const canManageUsers = useCallback((): boolean => {
    return isAdmin();
  }, [isAdmin]);

  const canEditTask = useCallback((taskCreatorId?: string, taskAssigneeId?: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Admin and project managers can edit any task
    if (hasAnyRole(['admin', 'manager'])) return true;
    
    // Task creator and assignee can edit the task
    return user.id === taskCreatorId || user.id === taskAssigneeId;
  }, [isAuthenticated, user, hasAnyRole]);

  const canDeleteTask = useCallback((taskCreatorId?: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Admin and project managers can delete any task
    if (hasAnyRole(['admin', 'manager'])) return true;
    
    // Task creator can delete the task
    return user.id === taskCreatorId;
  }, [isAuthenticated, user, hasAnyRole]);

  const canApproveTimeLog = useCallback((): boolean => {
    return hasAnyRole(['admin', 'manager']);
  }, [hasAnyRole]);

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isProjectManager,
    canManageProjects,
    canManageUsers,
    canEditTask,
    canDeleteTask,
    canApproveTimeLog,
  };
};

// Hook for protected routes
export const useRequireAuth = (requiredRole?: string) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    } else if (!isLoading && requiredRole && user?.role !== requiredRole) {
      window.location.href = '/unauthorized';
    }
  }, [isAuthenticated, isLoading, user?.role, requiredRole]);

  return { isAuthenticated, isLoading, user };
};