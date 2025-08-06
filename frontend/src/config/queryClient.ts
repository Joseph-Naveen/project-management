import { QueryClient } from '@tanstack/react-query';
import type { QueryClientConfig, DefaultOptions } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Default query options
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache time: how long data stays in cache after components unmount
    gcTime: 10 * 60 * 1000, // 10 minutes
    
    // Retry configuration - DISABLED for cost optimization on Render free tier
    retry: false, // No automatic retries to prevent excessive API calls
    
    // Retry delay - disabled since retry is false
    retryDelay: 0,
    
    // Refetch configuration - DISABLED to prevent unnecessary API calls
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    
    // Refetch interval (disabled by default, enable per query as needed)
    refetchInterval: false,
    
    // Background refetch interval when window is not focused
    refetchIntervalInBackground: false,
  },
  mutations: {
    // Retry configuration for mutations - DISABLED for cost optimization
    retry: false, // No automatic retries for mutations
    
    // Retry delay for mutations - disabled since retry is false
    retryDelay: 0,
  },
};

// Query client configuration
const queryClientConfig: QueryClientConfig = {
  defaultOptions: defaultQueryOptions,
};

// Create the query client
export const queryClient = new QueryClient(queryClientConfig);

// Global error handler for queries
queryClient.setMutationDefaults(['mutation'], {
  onError: (error: any) => {
    console.error('Mutation error:', error);
    
    // Show error toast for mutations
    const errorMessage = error?.response?.data?.message || 
                        error?.message || 
                        'An unexpected error occurred';
    
    toast.error(errorMessage, {
      toastId: 'mutation-error', // Prevent duplicate error toasts
    });
  },
});

// Note: Global query error handlers are handled individually in hooks
// React Query v5 doesn't support global onError for queries

// Query client event listeners
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'observerResultsUpdated') {
    // Handle query updates if needed
    // console.log('Query updated:', event);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === 'updated') {
    // Handle mutation updates if needed
    // console.log('Mutation updated:', event);
  }
});

// Utility functions for query management
export const queryUtils = {
  // Clear all queries
  clearAll: () => {
    queryClient.clear();
  },
  
  // Invalidate all queries
  invalidateAll: () => {
    queryClient.invalidateQueries();
  },
  
  // Reset all queries
  resetAll: () => {
    queryClient.resetQueries();
  },
  
  // Prefetch a query
  prefetch: async (queryKey: any[], queryFn: () => Promise<any>, options?: any) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      ...options,
    });
  },
  
  // Set query data manually
  setQueryData: (queryKey: any[], data: any) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get query data
  getQueryData: (queryKey: any[]) => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Remove a query
  removeQuery: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Cancel ongoing queries
  cancelQueries: (queryKey?: any[]) => {
    return queryClient.cancelQueries(queryKey ? { queryKey } : undefined);
  },
  
  // Get query state
  getQueryState: (queryKey: any[]) => {
    return queryClient.getQueryState(queryKey);
  },
  
  // Check if query is loading
  isLoading: (queryKey: any[]) => {
    const state = queryClient.getQueryState(queryKey);
    return state?.status === 'pending';
  },
  
  // Check if query has error
  hasError: (queryKey: any[]) => {
    const state = queryClient.getQueryState(queryKey);
    return state?.status === 'error';
  },
  
  // Get query error
  getError: (queryKey: any[]) => {
    const state = queryClient.getQueryState(queryKey);
    return state?.error;
  },
};

// Development tools integration
if (process.env.NODE_ENV === 'development') {
  // Query devtools logging is handled by React Query DevTools
  
  // Add global query client to window for debugging
  (window as any).__REACT_QUERY_CLIENT__ = queryClient;
}

// Query keys factory for consistent cache management
export const createQueryKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [entity, 'list'] as const,
  list: (filters: Record<string, any>) => [entity, 'list', { filters }] as const,
  details: () => [entity, 'detail'] as const,
  detail: (id: string) => [entity, 'detail', id] as const,
  search: (query: string) => [entity, 'search', query] as const,
  stats: () => [entity, 'stats'] as const,
  infinite: (filters: Record<string, any>) => [entity, 'infinite', { filters }] as const,
});

// Cache management utilities
export const cacheUtils = {
  // Get cache size
  getCacheSize: () => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().length;
  },
  
  // Get cache memory usage (approximate)
  getCacheMemoryUsage: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    let totalSize = 0;
    queries.forEach(query => {
      if (query.state.data) {
        try {
          totalSize += JSON.stringify(query.state.data).length;
        } catch (e) {
          // Skip circular references
        }
      }
    });
    
    return {
      queries: queries.length,
      approximateSize: `${(totalSize / 1024).toFixed(2)} KB`,
      totalBytes: totalSize,
    };
  },
  
  // Clear stale queries
  clearStaleQueries: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    queries.forEach(query => {
      if (query.isStale()) {
        cache.remove(query);
      }
    });
  },
  
  // Get query statistics
  getQueryStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      total: queries.length,
      loading: 0,
      error: 0,
      success: 0,
      idle: 0,
      stale: 0,
    };
    
    queries.forEach(query => {
      const status = query.state.status;
      stats[status as keyof typeof stats]++;
      
      if (query.isStale()) {
        stats.stale++;
      }
    });
    
    return stats;
  },
};

// Export default query client
export default queryClient;