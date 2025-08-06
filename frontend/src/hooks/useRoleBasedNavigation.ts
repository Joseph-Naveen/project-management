import { useMemo, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Clock, 
  BarChart3,
  Shield
} from 'lucide-react';
import { ROUTES } from '../constants';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export const useRoleBasedNavigation = () => {
  const { user, hasAnyRole } = useAuthContext();

  // Create our own hasAnyRole function to ensure it uses the correct user
  const localHasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  }, [user]);

  // Simple permission checker for now
  const hasPermission = useCallback((_permission: string): boolean => {
    if (!user) return false;
    // For now, just return true - you can implement proper permission logic later
    return true;
  }, [user]);

  const allNavigationItems: NavigationItem[] = useMemo(() => [
    { 
      name: 'Dashboard', 
      href: ROUTES.DASHBOARD, 
      icon: LayoutDashboard 
    },
    { 
      name: 'Projects', 
      href: ROUTES.PROJECTS, 
      icon: FolderOpen 
    },
    { 
      name: 'Tasks', 
      href: ROUTES.TASKS, 
      icon: CheckSquare 
    },
    { 
      name: 'Teams', 
      href: ROUTES.TEAM, 
      icon: Users,
      requiredRoles: ['admin', 'manager']
    },
    { 
      name: 'Timesheet', 
      href: ROUTES.TIMESHEET, 
      icon: Clock 
    },
    { 
      name: 'Reports', 
      href: ROUTES.REPORTS, 
      icon: BarChart3,
      requiredRoles: ['admin', 'manager']
    },
    {
      name: 'User Management',
      href: ROUTES.USER_MANAGEMENT,
      icon: Shield,
      requiredRoles: ['admin']
    }
  ], []);

  const filteredNavigation = useMemo(() => {
    if (!user) return [];

    // Debug logging
    console.log('[Navigation] User role check:', { 
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      hasAnyRole: localHasAnyRole(['admin']),
      originalHasAnyRole: hasAnyRole(['admin'])
    });

    return allNavigationItems.filter(item => {
      // If no role restrictions, show to everyone
      if (!item.requiredRoles && !item.requiredPermissions) {
        return true;
      }

      // Check role requirements using our local function
      if (item.requiredRoles && !localHasAnyRole(item.requiredRoles)) {
        console.log(`[Navigation] Item '${item.name}' filtered out - required roles:`, item.requiredRoles, 'user role:', user?.role);
        return false;
      }

      // Check permission requirements
      if (item.requiredPermissions) {
        return item.requiredPermissions.some(permission => hasPermission(permission));
      }

      return true;
    });
  }, [user, localHasAnyRole, hasAnyRole, hasPermission, allNavigationItems]);

  return {
    navigation: filteredNavigation,
    user
  };
};
