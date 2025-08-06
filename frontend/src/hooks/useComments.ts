import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services';
import { socketService } from '../services/socketService';
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types';

// Query keys for consistent caching
export const commentQueryKeys = {
  all: ['comments'] as const,
  lists: () => [...commentQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...commentQueryKeys.lists(), { filters }] as const,
  details: () => [...commentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentQueryKeys.details(), id] as const,
  thread: (id: string) => [...commentQueryKeys.detail(id), 'thread'] as const,
  byTask: (taskId: string) => [...commentQueryKeys.all, 'task', taskId] as const,
  byProject: (projectId: string) => [...commentQueryKeys.all, 'project', projectId] as const,
  taskComments: (taskId: string, parentId?: string | null) => [
    ...commentQueryKeys.byTask(taskId), 
    'comments', 
    { parentId }
  ] as const,
  projectComments: (projectId: string) => [
    ...commentQueryKeys.byProject(projectId), 
    'comments'
  ] as const,
  search: (query: string, filters: Record<string, any>) => [
    ...commentQueryKeys.all, 
    'search', 
    query, 
    { filters }
  ] as const,
};

// Hook for fetching comments
export const useComments = (params: {
  taskId?: string;
  projectId?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: commentQueryKeys.list(params),
    queryFn: async () => {
      const response = await commentService.getComments(params);
      return response.data;
    },
    enabled: !!(params.taskId || params.projectId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching a single comment
export const useComment = (id: string, enabled = true) => {
  return useQuery({
    queryKey: commentQueryKeys.detail(id),
    queryFn: async () => {
      const response = await commentService.getCommentById(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching task comments (optimized for task detail pages)
export const useTaskComments = (taskId: string, params?: {
  parentId?: string | null;
  page?: number;
  limit?: number;
}, enabled = true) => {
  return useQuery({
    queryKey: commentQueryKeys.taskComments(taskId, params?.parentId),
    queryFn: async () => {
      const response = await commentService.getTaskComments(taskId, params);
      return response.data;
    },
    enabled: enabled && !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook for fetching project comments
export const useProjectComments = (projectId: string, params?: {
  page?: number;
  limit?: number;
}, enabled = true) => {
  return useQuery({
    queryKey: commentQueryKeys.projectComments(projectId),
    queryFn: async () => {
      const response = await commentService.getProjectComments(projectId, params);
      return response.data;
    },
    enabled: enabled && !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching comment thread (parent + all replies)
export const useCommentThread = (commentId: string, enabled = true) => {
  return useQuery({
    queryKey: commentQueryKeys.thread(commentId),
    queryFn: async () => {
      const response = await commentService.getCommentThread(commentId);
      return response.data;
    },
    enabled: enabled && !!commentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook for searching comments
export const useSearchComments = (params: {
  query: string;
  taskId?: string;
  projectId?: string;
  authorId?: string;
  dateRange?: { start: string; end: string };
  page?: number;
  limit?: number;
}, enabled = true) => {
  return useQuery({
    queryKey: commentQueryKeys.search(params.query, params),
    queryFn: async () => {
      const response = await commentService.searchComments(params);
      return response.data;
    },
    enabled: enabled && params.query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for creating a comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateCommentRequest) => {
      const response = await commentService.createComment(commentData);
      return response.data;
    },
    onSuccess: (newComment) => {
      // Invalidate comments lists
      queryClient.invalidateQueries({ queryKey: commentQueryKeys.lists() });
      
      // Add to specific comment lists
      if (newComment.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.taskComments(newComment.taskId, newComment.parentId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.byTask(newComment.taskId) 
        });
      }
      
      if (newComment.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.projectComments(newComment.projectId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.byProject(newComment.projectId) 
        });
      }
      
      // Update parent comment thread if this is a reply
      if (newComment.parentId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.thread(newComment.parentId) 
        });
      }
      
      // Add the new comment to the cache
      queryClient.setQueryData(commentQueryKeys.detail(newComment.id), newComment);
    },
    onError: (error) => {
      console.error('Create comment error:', error);
    }
  });
};

// Hook for updating a comment
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCommentRequest }) => {
      const response = await commentService.updateComment(id, data);
      return response.data;
    },
    onSuccess: (updatedComment) => {
      // Update comment in cache
      queryClient.setQueryData(commentQueryKeys.detail(updatedComment.id), updatedComment);
      
      // Invalidate lists that contain this comment
      queryClient.invalidateQueries({ queryKey: commentQueryKeys.lists() });
      
      if (updatedComment.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.taskComments(updatedComment.taskId, updatedComment.parentId) 
        });
      }
      
      if (updatedComment.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.projectComments(updatedComment.projectId) 
        });
      }
      
      // Update parent thread if this is a reply
      if (updatedComment.parentId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.thread(updatedComment.parentId) 
        });
      }
    },
    onError: (error) => {
      console.error('Update comment error:', error);
    }
  });
};

// Hook for deleting a comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await commentService.deleteComment(id);
      return id;
    },
    onSuccess: (deletedId) => {
      const deletedComment = queryClient.getQueryData<Comment>(commentQueryKeys.detail(deletedId));
      
      // Remove comment from cache
      queryClient.removeQueries({ queryKey: commentQueryKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: commentQueryKeys.lists() });
      
      if (deletedComment?.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.taskComments(deletedComment.taskId, deletedComment.parentId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.byTask(deletedComment.taskId) 
        });
      }
      
      if (deletedComment?.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.projectComments(deletedComment.projectId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.byProject(deletedComment.projectId) 
        });
      }
      
      // Update parent thread if this was a reply
      if (deletedComment?.parentId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.thread(deletedComment.parentId) 
        });
      }
    },
    onError: (error) => {
      console.error('Delete comment error:', error);
    }
  });
};

// Hook for managing comment reactions
export const useCommentReactions = () => {
  const queryClient = useQueryClient();

  const addReaction = useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
      const response = await commentService.addReaction(commentId, emoji);
      return response.data;
    },
    onSuccess: (updatedComment) => {
      // Update comment in cache with new reactions
      queryClient.setQueryData(commentQueryKeys.detail(updatedComment.id), updatedComment);
      
      // Invalidate task/project comment lists to show updated reactions
      if (updatedComment.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.taskComments(updatedComment.taskId, updatedComment.parentId) 
        });
      }
      
      if (updatedComment.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.projectComments(updatedComment.projectId) 
        });
      }
    },
    onError: (error) => {
      console.error('Add reaction error:', error);
    }
  });

  const removeReaction = useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
      const response = await commentService.removeReaction(commentId, emoji);
      return response.data;
    },
    onSuccess: (updatedComment) => {
      // Update comment in cache with updated reactions
      queryClient.setQueryData(commentQueryKeys.detail(updatedComment.id), updatedComment);
      
      // Invalidate lists to show updated reactions
      if (updatedComment.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.taskComments(updatedComment.taskId, updatedComment.parentId) 
        });
      }
      
      if (updatedComment.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.projectComments(updatedComment.projectId) 
        });
      }
    },
    onError: (error) => {
      console.error('Remove reaction error:', error);
    }
  });

  return {
    addReaction,
    removeReaction
  };
};

// Hook for optimistic comment updates
export const useOptimisticCommentUpdate = () => {
  const queryClient = useQueryClient();

  const addCommentOptimistically = (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempId = `temp_${Date.now()}`;
    const tempComment: Comment = {
      ...comment,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
      isEdited: false,
      replies: []
    };

    // Add to cache temporarily
    queryClient.setQueryData(commentQueryKeys.detail(tempId), tempComment);

    return tempId;
  };

  const updateCommentOptimistically = (id: string, updates: Partial<Comment>) => {
    queryClient.setQueryData(
      commentQueryKeys.detail(id),
      (old: Comment | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      }
    );
  };

  const revertOptimisticUpdate = (id: string) => {
    queryClient.removeQueries({ queryKey: commentQueryKeys.detail(id) });
  };

  return {
    addCommentOptimistically,
    updateCommentOptimistically,
    revertOptimisticUpdate
  };
};

// Hook for comment filtering and sorting
export const useCommentFilters = () => {
  const getTopLevelComments = (taskId?: string, projectId?: string) => {
    return useComments({
      taskId,
      projectId,
      parentId: null // Only top-level comments
    });
  };

  const getCommentReplies = (taskId?: string, projectId?: string, parentId?: string) => {
    return useComments({
      taskId,
      projectId,
      parentId // Only replies to specific comment
    });
  };

  const searchCommentsByAuthor = (
    authorId: string, 
    params?: { taskId?: string; projectId?: string }
  ) => {
    return useSearchComments({
      query: '', // Empty query to get all comments by author
      authorId,
      ...params
    });
  };

  const searchCommentsByDate = (
    dateRange: { start: string; end: string },
    params?: { taskId?: string; projectId?: string }
  ) => {
    return useSearchComments({
      query: '', // Empty query to get all comments in date range
      dateRange,
      ...params
    });
  };

  return {
    getTopLevelComments,
    getCommentReplies,
    searchCommentsByAuthor,
    searchCommentsByDate
  };
};

// Hook for comment statistics and analytics
export const useCommentStats = (params?: {
  taskId?: string;
  projectId?: string;
  dateRange?: { start: string; end: string };
}) => {
  return useQuery({
    queryKey: [...commentQueryKeys.all, 'stats', params],
    queryFn: async () => {
      // This would be implemented in the comment service
      // For now, we'll derive stats from existing comment data
      const response = await commentService.getComments({
        taskId: params?.taskId,
        projectId: params?.projectId,
        parentId: null,
        page: 1,
        limit: 100
      });
      const comments = response.data.comments;
      
      const stats = {
        total: comments.length,
        byAuthor: comments.reduce((acc, comment) => {
          const authorName = comment.author?.name || 'Unknown';
          acc[authorName] = (acc[authorName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        withReactions: comments.filter(c => c.reactions.length > 0).length,
        withAttachments: comments.filter(c => c.attachments && c.attachments.length > 0).length,
        threads: comments.filter(c => !c.parentId).length,
        replies: comments.filter(c => !!c.parentId).length,
        averageLength: Math.round(
          comments.reduce((sum, c) => sum + c.content.length, 0) / comments.length
        )
      };
      
      return stats;
    },
    enabled: !!(params?.taskId || params?.projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for real-time comment updates (WebSocket ready)
export const useCommentRealTime = (taskId?: string, projectId?: string) => {
  const queryClient = useQueryClient();

  const subscribeToCommentUpdates = () => {
    const handleCommentAdded = (newComment: Comment) => {
      queryClient.setQueryData(commentQueryKeys.detail(newComment.id), newComment);
      if (newComment.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.taskComments(newComment.taskId, newComment.parentId) 
        });
      }
      if (newComment.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: commentQueryKeys.projectComments(newComment.projectId) 
        });
      }
    };
    
    const handleCommentUpdated = (updatedComment: Comment) => {
      queryClient.setQueryData(commentQueryKeys.detail(updatedComment.id), updatedComment);
    };
    
    const handleCommentDeleted = (deletedCommentId: string) => {
      queryClient.removeQueries({ queryKey: commentQueryKeys.detail(deletedCommentId) });
    };
    
    if (taskId) {
      socketService.subscribe(`task:${taskId}:comments`, handleCommentAdded);
      socketService.subscribe(`task:${taskId}:comment-updated`, handleCommentUpdated);
      socketService.subscribe(`task:${taskId}:comment-deleted`, handleCommentDeleted);
    }
    
    if (projectId) {
      socketService.subscribe(`project:${projectId}:comments`, handleCommentAdded);
      socketService.subscribe(`project:${projectId}:comment-updated`, handleCommentUpdated);
      socketService.subscribe(`project:${projectId}:comment-deleted`, handleCommentDeleted);
    }
  };

  const unsubscribeFromCommentUpdates = () => {
    if (taskId) {
      socketService.unsubscribe(`task:${taskId}:comments`);
      socketService.unsubscribe(`task:${taskId}:comment-updated`);
      socketService.unsubscribe(`task:${taskId}:comment-deleted`);
    }
    
    if (projectId) {
      socketService.unsubscribe(`project:${projectId}:comments`);
      socketService.unsubscribe(`project:${projectId}:comment-updated`);
      socketService.unsubscribe(`project:${projectId}:comment-deleted`);
    }
  };

  return {
    subscribeToCommentUpdates,
    unsubscribeFromCommentUpdates
  };
};

// Hook for comment prefetching
export const usePrefetchComments = () => {
  const queryClient = useQueryClient();

  const prefetchTaskComments = (taskId: string) => {
    queryClient.prefetchQuery({
      queryKey: commentQueryKeys.taskComments(taskId, null),
      queryFn: async () => {
        const response = await commentService.getTaskComments(taskId);
        return response.data;
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  const prefetchProjectComments = (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: commentQueryKeys.projectComments(projectId),
      queryFn: async () => {
        const response = await commentService.getProjectComments(projectId);
        return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  const prefetchCommentThread = (commentId: string) => {
    queryClient.prefetchQuery({
      queryKey: commentQueryKeys.thread(commentId),
      queryFn: async () => {
        const response = await commentService.getCommentThread(commentId);
        return response.data;
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  return {
    prefetchTaskComments,
    prefetchProjectComments,
    prefetchCommentThread
  };
};