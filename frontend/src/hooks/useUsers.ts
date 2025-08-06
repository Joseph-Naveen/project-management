import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services';
import type { User, UpdateUserRequest, UserProfile } from '../types';

// Query keys for consistent caching
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userQueryKeys.lists(), { filters }] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
  profile: (id: string) => [...userQueryKeys.detail(id), 'profile'] as const,
  stats: (id: string) => [...userQueryKeys.detail(id), 'stats'] as const,
  teamMembers: () => [...userQueryKeys.all, 'team-members'] as const,
  projectMembers: (projectId: string) => [...userQueryKeys.teamMembers(), 'project', projectId] as const,
  byDepartment: (department: string) => [...userQueryKeys.all, 'department', department] as const,
  byRole: (role: string) => [...userQueryKeys.all, 'role', role] as const,
  search: (query: string) => [...userQueryKeys.all, 'search', query] as const,
};

// Hook for fetching users list
export const useUsers = (params?: {
  role?: string;
  department?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: userQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await userService.getUsers(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for fetching a single user
export const useUser = (id: string, enabled = true) => {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: async () => {
      const response = await userService.getUserById(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for fetching user profile with additional details
export const useUserProfile = (id: string, enabled = true) => {
  return useQuery({
    queryKey: userQueryKeys.profile(id),
    queryFn: async () => {
      const response = await userService.getUserProfile(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Hook for fetching user statistics
export const useUserStats = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: userQueryKeys.stats(userId),
    queryFn: async () => {
      const response = await userService.getUserStats(userId);
      return response.data;
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching team members
export const useTeamMembers = (projectId?: string) => {
  const queryKey = projectId 
    ? userQueryKeys.projectMembers(projectId)
    : userQueryKeys.teamMembers();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await userService.getTeamMembers(projectId);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for searching users
export const useSearchUsers = (query: string, limit = 10, enabled = true) => {
  return useQuery({
    queryKey: userQueryKeys.search(query),
    queryFn: async () => {
      const response = await userService.searchUsers(query, limit);
      return response.data;
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook for fetching users by department
export const useUsersByDepartment = (department: string, enabled = true) => {
  return useQuery({
    queryKey: userQueryKeys.byDepartment(department),
    queryFn: async () => {
      const response = await userService.getUsersByDepartment(department);
      return response.data;
    },
    enabled: enabled && !!department,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching users by role
export const useUsersByRole = (role: string, enabled = true) => {
  return useQuery({
    queryKey: userQueryKeys.byRole(role),
    queryFn: async () => {
      const response = await userService.getUsersByRole(role);
      return response.data;
    },
    enabled: enabled && !!role,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for updating a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      const response = await userService.updateUser(id, data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update user in cache
      queryClient.setQueryData(userQueryKeys.detail(updatedUser.id), updatedUser);
      
      // Update in profile cache if it exists
      queryClient.invalidateQueries({ queryKey: userQueryKeys.profile(updatedUser.id) });
      
      // Invalidate users lists to refetch
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      
      // Invalidate team members if user data changed
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
      
      // Invalidate department/role queries if those fields changed
      if (updatedUser.department) {
        queryClient.invalidateQueries({ queryKey: userQueryKeys.byDepartment(updatedUser.department) });
      }
      queryClient.invalidateQueries({ queryKey: userQueryKeys.byRole(updatedUser.role) });
    },
    onError: (error) => {
      console.error('Update user error:', error);
    }
  });
};

// Hook for updating user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'manager' | 'developer' | 'qa' | 'owner' | 'member' }) => {
      const response = await userService.updateUserRole(id, role);
      return response.data;
    },
    onSuccess: (updatedUser, { role: oldRole }) => {
      // Update user in cache
      queryClient.setQueryData(userQueryKeys.detail(updatedUser.id), updatedUser);
      
      // Invalidate users lists
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      
      // Invalidate role-based queries
      queryClient.invalidateQueries({ queryKey: userQueryKeys.byRole(oldRole) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.byRole(updatedUser.role) });
      
      // Invalidate team members
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Update user role error:', error);
    }
  });
};

// Hook for activating/deactivating users
export const useUserActivation = () => {
  const queryClient = useQueryClient();

  const activateUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.activateUser(id);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userQueryKeys.detail(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Activate user error:', error);
    }
  });

  const deactivateUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.deactivateUser(id);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userQueryKeys.detail(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Deactivate user error:', error);
    }
  });

  return {
    activateUser,
    deactivateUser
  };
};

// Hook for updating user avatar
export const useUpdateUserAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, avatarFile }: { id: string; avatarFile: File }) => {
      const response = await userService.updateUserAvatar(id, avatarFile);
      return { id, avatarUrl: response.data.avatarUrl };
    },
    onSuccess: ({ id, avatarUrl }) => {
      // Update user avatar in cache
      queryClient.setQueryData(
        userQueryKeys.detail(id),
        (old: User | undefined) => {
          if (!old) return old;
          return { ...old, avatar: avatarUrl };
        }
      );
      
      // Update in profile cache
      queryClient.setQueryData(
        userQueryKeys.profile(id),
        (old: UserProfile | undefined) => {
          if (!old) return old;
          return { ...old, avatar: avatarUrl };
        }
      );
      
      // Invalidate team members to show updated avatar
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Update user avatar error:', error);
    }
  });
};

// Hook for user filtering helpers
export const useUserFilters = () => {
  const getActiveUsers = (params?: Omit<Parameters<typeof useUsers>[0], 'isActive'>) => {
    return useUsers({ ...params, isActive: true });
  };

  const getInactiveUsers = (params?: Omit<Parameters<typeof useUsers>[0], 'isActive'>) => {
    return useUsers({ ...params, isActive: false });
  };

  const getAdmins = (params?: Omit<Parameters<typeof useUsers>[0], 'role'>) => {
    return useUsers({ ...params, role: 'admin' });
  };

  const getProjectManagers = (params?: Omit<Parameters<typeof useUsers>[0], 'role'>) => {
    return useUsers({ ...params, role: 'manager' });
  };

  const getTeamMembers = (params?: Omit<Parameters<typeof useUsers>[0], 'role'>) => {
    return useUsers({ ...params, role: 'member' });
  };

  const getViewers = (params?: Omit<Parameters<typeof useUsers>[0], 'role'>) => {
    return useUsers({ ...params, role: 'viewer' });
  };

  return {
    getActiveUsers,
    getInactiveUsers,
    getAdmins,
    getProjectManagers,
    getTeamMembers,
    getViewers
  };
};

// Hook for user role and permission helpers
export const useUserPermissions = () => {
  const checkUserRole = (user: User | null, requiredRole: string): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'member': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  const checkUserPermission = (user: User | null, permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      'admin': ['*'], // Admin has all permissions
      'project_manager': [
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
      'member': [
        'projects.view',
        'tasks.create',
        'tasks.update',
        'tasks.view',
        'time_logs.create',
        'time_logs.update',
        'comments.create',
        'comments.update'
      ],
      'viewer': [
        'projects.view',
        'tasks.view',
        'time_logs.view',
        'comments.view'
      ]
    };

    const userPermissions = permissions[user.role as keyof typeof permissions] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    return userPermissions.includes(permission);
  };

  const getUserRoleBadgeColor = (role: string): string => {
    const roleColors = {
      'admin': 'danger',
      'manager': 'warning',
      'member': 'info',
      'viewer': 'secondary'
    };

    return roleColors[role as keyof typeof roleColors] || 'default';
  };

  const getUserRoleDisplayName = (role: string): string => {
    const roleNames = {
      'admin': 'Administrator',
      'manager': 'Project Manager',
      'member': 'Team Member',
      'viewer': 'Viewer'
    };

    return roleNames[role as keyof typeof roleNames] || role;
  };

  return {
    checkUserRole,
    checkUserPermission,
    getUserRoleBadgeColor,
    getUserRoleDisplayName
  };
};

// Hook for bulk user operations
export const useBulkUserOperations = () => {
  const queryClient = useQueryClient();

  const bulkUpdateUsers = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: UpdateUserRequest }>) => {
      const promises = updates.map(({ id, data }) => 
        userService.updateUser(id, data)
      );
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedUsers) => {
      // Update each user in cache
      updatedUsers.forEach(user => {
        queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Bulk update users error:', error);
    }
  });

  const bulkUpdateUserRoles = useMutation({
    mutationFn: async (updates: Array<{ id: string; role: 'admin' | 'manager' | 'developer' | 'qa' | 'owner' | 'member' }>) => {
      const promises = updates.map(({ id, role }) => 
        userService.updateUserRole(id, role)
      );
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedUsers) => {
      // Update users in cache
      updatedUsers.forEach(user => {
        queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      });
      
      // Invalidate all role-based queries
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
      
      ['admin', 'manager', 'member', 'viewer'].forEach(role => {
        queryClient.invalidateQueries({ queryKey: userQueryKeys.byRole(role) });
      });
    },
    onError: (error) => {
      console.error('Bulk update user roles error:', error);
    }
  });

  const bulkActivateUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = userIds.map(id => userService.activateUser(id));
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedUsers) => {
      updatedUsers.forEach(user => {
        queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      });
      
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Bulk activate users error:', error);
    }
  });

  const bulkDeactivateUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = userIds.map(id => userService.deactivateUser(id));
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedUsers) => {
      updatedUsers.forEach(user => {
        queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      });
      
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.teamMembers() });
    },
    onError: (error) => {
      console.error('Bulk deactivate users error:', error);
    }
  });

  return {
    bulkUpdateUsers,
    bulkUpdateUserRoles,
    bulkActivateUsers,
    bulkDeactivateUsers
  };
};

// Hook for prefetching users
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();

  const prefetchUser = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: userQueryKeys.detail(id),
      queryFn: async () => {
        const response = await userService.getUserById(id);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchUserProfile = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: userQueryKeys.profile(id),
      queryFn: async () => {
        const response = await userService.getUserProfile(id);
        return response.data;
      },
      staleTime: 3 * 60 * 1000, // 3 minutes
    });
  };

  const prefetchTeamMembers = (projectId?: string) => {
    const queryKey = projectId 
      ? userQueryKeys.projectMembers(projectId)
      : userQueryKeys.teamMembers();

    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const response = await userService.getTeamMembers(projectId);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    prefetchUser,
    prefetchUserProfile,
    prefetchTeamMembers
  };
};

// Hook for deleting a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.deleteUser(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users lists
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
    },
  });
};

// Hook for creating a user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      name: string;
      email: string;
      password?: string;
      role?: 'admin' | 'manager' | 'developer' | 'qa';
      department?: string;
      jobTitle?: string;
      phone?: string;
    }) => {
      const response = await userService.createUser(userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users lists
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
    onError: (error) => {
      console.error('Error creating user:', error);
    },
  });
};