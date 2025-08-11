import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from '../constants';

// Types for API responses
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// Token management utility
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }
}

// API Client class
class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    console.log('🔧 API Client Configuration:', {
      baseURL: API_CONFIG.BASE_URL,
      environment: import.meta.env.MODE,
      viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL
    });
    
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = TokenManager.getAccessToken();
        const url = config.url || '';
        const isPublicAuthEndpoint = (
          url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/refresh') ||
          url.includes('/auth/check-email')
        );

        // Skip API calls if no token is available (except explicit public auth endpoints)
        if (!token && !isPublicAuthEndpoint) {
          console.log('[API] Skipping request - no auth token available');
          return Promise.reject(new Error('No authentication token available'));
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for debugging
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
        
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle responses and token refresh
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`[API] Response ${response.status}:`, response.data);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        console.error(`[API] Response error ${error.response?.status}:`, error.response?.data);

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't retry if we're already on the login page
          if (window.location.pathname === '/login') {
            return Promise.reject(this.handleError(error));
          }
          
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.instance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = TokenManager.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Attempt to refresh the token
            const response = await this.refreshToken(refreshToken);
            // Support both backend response shapes: { data: { token, refreshToken } } or { data: { accessToken, refreshToken } }
            const { token, accessToken, refreshToken: newRefreshToken } = (response.data || {}) as any;
            const newAccessToken = accessToken || token;
            if (!newAccessToken || !newRefreshToken) {
              throw new Error('Invalid refresh response');
            }

            TokenManager.setTokens(newAccessToken, newRefreshToken);

            // Process the failed queue
            this.failedQueue.forEach(({ resolve }) => resolve());
            this.failedQueue = [];

            // Retry the original request
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            TokenManager.clearTokens();
            
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshToken(refreshToken: string): Promise<ApiResponse> {
    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    return response.data;
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response;
    
    if (response) {
      // Server responded with error status
      const errorData = response.data as any;
      
      // Handle specific authentication errors
      if (response.status === 401) {
        // Clear tokens on authentication error
        TokenManager.clearTokens();
        
        // Dispatch custom event for auth error handling
        window.dispatchEvent(new CustomEvent('auth-error', {
          detail: { type: 'unauthorized', message: 'Session expired. Please login again.' }
        }));
        
        return {
          message: 'Session expired. Please login again.',
          status: 401,
          errors: ['Authentication required'],
        };
      }
      
      if (response.status === 403) {
        return {
          message: 'Access denied. You don\'t have permission to perform this action.',
          status: 403,
          errors: ['Insufficient permissions'],
        };
      }
      
      if (response.status === 429) {
        return {
          message: 'Too many requests. Please try again later.',
          status: 429,
          errors: ['Rate limit exceeded'],
        };
      }
      
      return {
        message: errorData?.message || 'An error occurred',
        status: response.status,
        errors: errorData?.errors || [],
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0,
        errors: ['No response from server'],
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
        errors: ['Request configuration error'],
      };
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Retry mechanism for failed requests - DISABLED for cost optimization on Render free tier
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    // No retry logic - execute request only once to prevent excessive API calls
    return await requestFn();
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.instance.get(url, config));
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.instance.post(url, data, config));
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.instance.put(url, data, config));
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.instance.patch(url, data, config));
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.instance.delete(url, config));
    return response.data;
  }

  // File upload method
  async uploadFile<T>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  // Download file method
  async downloadFile(
    url: string,
    filename?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Create download link
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Get raw axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export token manager for external usage
export { TokenManager };

// Export types
export type { AxiosRequestConfig, AxiosResponse, AxiosError };