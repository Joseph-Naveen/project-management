import React, { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth, usePermissions } from '../hooks/useAuth';
import type { UseAuthReturn } from '../hooks/useAuth';


// Auth context interface
interface AuthContextType extends UseAuthReturn {
  // Additional context-specific methods can be added here
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isProjectManager: () => boolean;
  canManageProjects: () => boolean;
  canManageUsers: () => boolean;
  canEditTask: (taskCreatorId?: string, taskAssigneeId?: string) => boolean;
  canDeleteTask: (taskCreatorId?: string) => boolean;
  canApproveTimeLog: () => boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authHook = useAuth();
  const permissions = usePermissions();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateUser,
    isLoginLoading,
    isRegisterLoading,
    isLogoutLoading,
  } = authHook;

  // Add permissions to context value
  const contextValue: AuthContextType = {
    // Auth state and methods
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateUser,
    isLoginLoading,
    isRegisterLoading,
    isLogoutLoading,
    
    // Permission methods
    hasPermission: (permission: string) => {
      if (!isAuthenticated || !user) return false;
      
      const userPermissions = {
        'admin': ['*'], // Admin has all permissions
        'manager': [
          'projects.create',
          'projects.update',
          'projects.delete',
          'tasks.create',
          'tasks.update',
          'tasks.delete',
          'tasks.assign',
          'time_logs.approve',
          'users.view',
          'reports.view'
        ],
        'developer': [
          'projects.view',
          'tasks.create',
          'tasks.update',
          'tasks.view',
          'time_logs.create',
          'time_logs.update',
          'comments.create',
          'comments.update'
        ],
        'qa': [
          'projects.view',
          'tasks.view',
          'tasks.create',
          'tasks.update',
          'time_logs.create',
          'time_logs.view',
          'comments.create',
          'comments.view'
        ]
      };

      const rolePermissions = userPermissions[user.role as keyof typeof userPermissions] || [];
      
      // Admin has all permissions
      if (rolePermissions.includes('*')) return true;
      
      return rolePermissions.includes(permission);
    },
    
    hasRole: permissions.hasRole,
    hasAnyRole: permissions.hasAnyRole,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    canManageProjects: permissions.canManageProjects,
    canManageUsers: permissions.canManageUsers,
    canEditTask: permissions.canEditTask,
    canDeleteTask: permissions.canDeleteTask,
    canApproveTimeLog: permissions.canApproveTimeLog,
  };

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Auth state changed:', {
        isAuthenticated,
        user: user ? { id: user.id, name: user.name, role: user.role } : null,
        isLoading,
        error
      });
      
      // Test the hasAnyRole function
      if (user) {
        console.log('[AuthContext] Role checks:', {
          userRole: user.role,
          hasAdminRole: permissions.hasAnyRole(['admin']),
          hasManagerRole: permissions.hasAnyRole(['manager']),
          canManageUsers: permissions.canManageUsers()
        });
      }
    }
  }, [isAuthenticated, user, isLoading, error, permissions]);

  // Handle authentication errors globally
  useEffect(() => {
    if (error) {
      console.error('[AuthContext] Authentication error:', error);
      
      // You could dispatch a global notification here
      // notificationService.showError('Authentication Error', error);
    }
  }, [error]);

  // Listen for authentication errors from API client
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      const { type, message } = event.detail;
      
      console.error('[AuthContext] Auth error event:', { type, message });
      
      if (type === 'unauthorized') {
        // Use logout to clear auth state and redirect
        logout();
      }
    };

    window.addEventListener('auth-error', handleAuthError as EventListener);
    
    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected components
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) => {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, isLoading, user } = useAuthContext();

    // Show loading while checking authentication
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    // Check role requirement
    if (requiredRole && user?.role !== requiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

// Component for role-based rendering
interface RoleGuardProps {
  children: ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, requires ALL roles/permissions. If false, requires ANY (default)
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles = [],
  permissions = [],
  fallback = null,
  requireAll = false
}) => {
  const { hasRole, hasAnyRole, hasPermission, isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check roles
  if (roles.length > 0) {
    const hasRequiredRole = requireAll 
      ? roles.every(role => hasRole(role))
      : hasAnyRole(roles);
      
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permissions
  if (permissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission));
      
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Hook for conditional rendering based on authentication state
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuthContext();

  const canRender = (options: {
    requireAuth?: boolean;
    roles?: string[];
    permissions?: string[];
    requireAll?: boolean;
  } = {}) => {
    const { requireAuth = true, roles = [], permissions = [], requireAll = false } = options;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      return false;
    }

    // Check roles
    if (roles.length > 0) {
      const hasRequiredRole = requireAll 
        ? roles.every(role => hasRole(role))
        : roles.some(role => hasRole(role));
        
      if (!hasRequiredRole) {
        return false;
      }
    }

    // Check permissions
    if (permissions.length > 0) {
      const hasRequiredPermission = requireAll
        ? permissions.every(permission => hasPermission(permission))
        : permissions.some(permission => hasPermission(permission));
        
      if (!hasRequiredPermission) {
        return false;
      }
    }

    return true;
  };

  return {
    canRender,
    isAuthenticated,
    isLoading,
    user
  };
};