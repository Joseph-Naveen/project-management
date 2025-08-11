import { apiClient, TokenManager } from './apiClient';
import type { ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { User, LoginRequest, RegisterRequest } from '../types';
import type { AuthResponse } from '../types/api';

// Auth Service class
class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.success && response.data) {
        TokenManager.setTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error: unknown) {
      console.error('Login error:', error);
      // Single retry on transient failures (network/CORS/backend warm-up or DB health 503)
      const status = (typeof error === 'object' && error !== null && 'status' in error)
        ? Number((error as { status?: number }).status || 0)
        : (typeof error === 'object' && error !== null && 'response' in error)
          ? Number(((error as { response?: { status?: number } }).response?.status) || 0)
          : 0;
      const message = (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as { message?: string }).message || '')
        : '';
      const isTransient = status === 503 || status === 0 || /Network error/i.test(message);
      if (isTransient) {
        await new Promise((res) => setTimeout(res, 1200));
        const retry = await apiClient.post<AuthResponse>(
          API_ENDPOINTS.AUTH.LOGIN,
          credentials
        );
        if (retry.success && retry.data) {
          TokenManager.setTokens(retry.data.token, retry.data.refreshToken);
        }
        return retry;
      }
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response.success && response.data) {
        TokenManager.setTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ token: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      if (response.success && response.data) {
        TokenManager.setTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
      TokenManager.clearTokens();
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens anyway on logout error
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    if (!token) return false;

    try {
      // In real app, you might want to decode JWT and check expiration
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user from token (without API call)
   */
  getCurrentUserFromToken(): User | null {
    // In real app, you would decode JWT token to get user info
    // For now, return null as we need to make an API call
    return null;
  }
}

// Export singleton instance
export const authService = new AuthService();