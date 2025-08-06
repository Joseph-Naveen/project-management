import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types';

// Query keys for consistent caching
export const projectQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectQueryKeys.lists(), { filters }] as const,
  details: () => [...projectQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectQueryKeys.details(), id] as const,
  members: (id: string) => [...projectQueryKeys.detail(id), 'members'] as const,
  stats: (id: string) => [...projectQueryKeys.detail(id), 'stats'] as const,
};

// Hook for fetching projects list
export const useProjects = (params?: {
  status?: string;
  priority?: string;
  ownerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: projectQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await projectService.getProjects(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single project
export const useProject = (id: string, enabled = true) => {
  return useQuery({
    queryKey: projectQueryKeys.detail(id),
    queryFn: async () => {
      const response = await projectService.getProjectById(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching project members
export const useProjectMembers = (projectId: string, enabled = true) => {
  return useQuery({
    queryKey: projectQueryKeys.members(projectId),
    queryFn: async () => {
      const response = await projectService.getProjectMembers(projectId);
      return response.data;
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching project statistics
export const useProjectStats = (projectId: string, enabled = true) => {
  return useQuery({
    queryKey: projectQueryKeys.stats(projectId),
    queryFn: async () => {
      const response = await projectService.getProjectStats(projectId);
      return response.data;
    },
    enabled: enabled && !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute (stats change frequently)
  });
};

// Hook for creating a project
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: CreateProjectRequest) => {
      const response = await projectService.createProject(projectData);
      return response.data;
    },
    onSuccess: (newProject) => {
      // Invalidate projects lists to refetch
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      
      // Add the new project to the cache
      queryClient.setQueryData(projectQueryKeys.detail(newProject.id), newProject);
      
      // Update any filtered lists that might include this project
      queryClient.invalidateQueries({ 
        queryKey: projectQueryKeys.all,
        exact: false 
      });
    },
    onError: (error) => {
      console.error('Create project error:', error);
    }
  });
};

// Hook for updating a project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectRequest }) => {
      const response = await projectService.updateProject(id, data);
      return response.data;
    },
    onSuccess: (updatedProject) => {
      // Update the project in cache
      queryClient.setQueryData(projectQueryKeys.detail(updatedProject.id), updatedProject);
      
      // Invalidate and refetch projects lists
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      
      // Invalidate project stats as they might have changed
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.stats(updatedProject.id) });
    },
    onError: (error) => {
      console.error('Update project error:', error);
    }
  });
};

// Hook for deleting a project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await projectService.deleteProject(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove project from cache
      queryClient.removeQueries({ queryKey: projectQueryKeys.detail(deletedId) });
      
      // Invalidate projects lists
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      
      // Remove related data
      queryClient.removeQueries({ queryKey: projectQueryKeys.members(deletedId) });
      queryClient.removeQueries({ queryKey: projectQueryKeys.stats(deletedId) });
    },
    onError: (error) => {
      console.error('Delete project error:', error);
    }
  });
};

// Hook for adding a project member
export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      userId, 
      role = 'member' 
    }: { 
      projectId: string; 
      userId: string; 
      role?: 'owner' | 'admin' | 'member' | 'viewer' 
    }) => {
      const response = await projectService.addProjectMember(projectId, userId, role);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate project members
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
      
      // Update project data if it includes member count
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.stats(projectId) });
    },
    onError: (error) => {
      console.error('Add project member error:', error);
    }
  });
};

// Hook for removing a project member
export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      await projectService.removeProjectMember(projectId, userId);
      return { projectId, userId };
    },
    onSuccess: ({ projectId }) => {
      // Invalidate project members
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
      
      // Update project data
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.stats(projectId) });
    },
    onError: (error) => {
      console.error('Remove project member error:', error);
    }
  });
};

// Hook for updating project member role
export const useUpdateProjectMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      userId, 
      role 
    }: { 
      projectId: string; 
      userId: string; 
      role: 'owner' | 'admin' | 'member' | 'viewer' 
    }) => {
      const response = await projectService.updateProjectMemberRole(projectId, userId, role);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate project members to refetch with updated role
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
    },
    onError: (error) => {
      console.error('Update project member role error:', error);
    }
  });
};

// Optimistic updates helper hook
export const useOptimisticProjectUpdate = () => {
  const queryClient = useQueryClient();

  const updateProjectOptimistically = (id: string, updates: Partial<Project>) => {
    queryClient.setQueryData(
      projectQueryKeys.detail(id),
      (old: Project | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      }
    );
  };

  const revertOptimisticUpdate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(id) });
  };

  return {
    updateProjectOptimistically,
    revertOptimisticUpdate
  };
};

// Hook for prefetching projects (useful for navigation)
export const usePrefetchProject = () => {
  const queryClient = useQueryClient();

  const prefetchProject = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: projectQueryKeys.detail(id),
      queryFn: async () => {
        const response = await projectService.getProjectById(id);
        return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  const prefetchProjectMembers = (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: projectQueryKeys.members(projectId),
      queryFn: async () => {
        const response = await projectService.getProjectMembers(projectId);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    prefetchProject,
    prefetchProjectMembers
  };
};

// Hook for bulk operations
export const useBulkProjectOperations = () => {
  const queryClient = useQueryClient();

  const bulkUpdateProjects = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: UpdateProjectRequest }>) => {
      const promises = updates.map(({ id, data }) => 
        projectService.updateProject(id, data)
      );
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    },
    onSuccess: (updatedProjects) => {
      // Update each project in cache
      updatedProjects.forEach(project => {
        queryClient.setQueryData(projectQueryKeys.detail(project.id), project);
      });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Bulk update projects error:', error);
    }
  });

  const bulkDeleteProjects = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => projectService.deleteProject(id));
      await Promise.all(promises);
      return ids;
    },
    onSuccess: (deletedIds) => {
      // Remove projects from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: projectQueryKeys.detail(id) });
        queryClient.removeQueries({ queryKey: projectQueryKeys.members(id) });
        queryClient.removeQueries({ queryKey: projectQueryKeys.stats(id) });
      });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Bulk delete projects error:', error);
    }
  });

  return {
    bulkUpdateProjects,
    bulkDeleteProjects
  };
};

// Hook for project filtering and search
export const useProjectFilters = () => {
  const getActiveProjects = (params?: Omit<Parameters<typeof useProjects>[0], 'status'>) => {
    return useProjects({ ...params, status: 'active' });
  };

  const getCompletedProjects = (params?: Omit<Parameters<typeof useProjects>[0], 'status'>) => {
    return useProjects({ ...params, status: 'completed' });
  };

  const getPlanningProjects = (params?: Omit<Parameters<typeof useProjects>[0], 'status'>) => {
    return useProjects({ ...params, status: 'planning' });
  };

  const getHighPriorityProjects = (params?: Omit<Parameters<typeof useProjects>[0], 'priority'>) => {
    return useProjects({ ...params, priority: 'high' });
  };

  const getMyProjects = (userId: string, params?: Omit<Parameters<typeof useProjects>[0], 'ownerId'>) => {
    return useProjects({ ...params, ownerId: userId });
  };

  const searchProjects = (searchQuery: string, params?: Omit<Parameters<typeof useProjects>[0], 'search'>) => {
    return useProjects({ ...params, search: searchQuery });
  };

  return {
    getActiveProjects,
    getCompletedProjects,
    getPlanningProjects,
    getHighPriorityProjects,
    getMyProjects,
    searchProjects
  };
};

// Hook for real-time project updates (WebSocket integration ready)
export const useProjectRealTime = (projectId: string) => {
  // const queryClient = useQueryClient(); // Will be used for real-time updates

  // This would integrate with WebSocket or Server-Sent Events
  // For now, it's a placeholder for future real-time functionality
  const subscribeToProjectUpdates = () => {
    // TODO: Implement WebSocket subscription
    console.log(`Subscribing to real-time updates for project ${projectId}`);
    
    // Example of how real-time updates would work:
    // const handleProjectUpdate = (updatedProject: Project) => {
    //   queryClient.setQueryData(projectQueryKeys.detail(projectId), updatedProject);
    // };
    // 
    // const handleMemberUpdate = (members: ProjectMember[]) => {
    //   queryClient.setQueryData(projectQueryKeys.members(projectId), members);
    // };
    // 
    // WebSocketService.subscribe(`project:${projectId}`, handleProjectUpdate);
    // WebSocketService.subscribe(`project:${projectId}:members`, handleMemberUpdate);
  };

  const unsubscribeFromProjectUpdates = () => {
    // TODO: Implement WebSocket unsubscription
    console.log(`Unsubscribing from real-time updates for project ${projectId}`);
  };

  return {
    subscribeToProjectUpdates,
    unsubscribeFromProjectUpdates
  };
};