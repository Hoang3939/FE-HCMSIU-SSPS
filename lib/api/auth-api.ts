import axios from 'axios';
import apiClient, { resetInterceptorState } from './apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../api-config';
import type { ApiResponse, LoginResponse, RefreshTokenResponse } from '../types/api.types';
import { useAuthStore } from '../stores/auth-store';

/**
 * Login Request Interface
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Auth API Client
 */
class AuthAPI {
  /**
   * Đăng nhập
   * @param credentials - Username và password
   * @returns Access token và user info
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Reset interceptor state before login to avoid conflicts with old tokens
    resetInterceptorState();
    
    // Clear old auth state before login
    useAuthStore.getState().clearAuth();
    
    // Use fetch directly to avoid interceptor adding old Authorization header
    const response = await fetch(
      `${API_BASE_URL}/api${API_ENDPOINTS.auth.login}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies
        body: JSON.stringify(credentials),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Đăng nhập thất bại' 
      }));
      throw new Error(errorData.message || 'Đăng nhập thất bại');
    }

    const data: ApiResponse<LoginResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    const { token, user } = data.data;
    
    // Save accessToken and user to store
    // Refresh token is stored in HttpOnly cookie automatically by server
    useAuthStore.getState().setAuth(token, user);
    
    return data.data;
  }

  /**
   * Đăng xuất
   * Refresh token sẽ được xóa tự động bởi server (HttpOnly cookie)
   */
  async logout(): Promise<void> {
    // Reset interceptor state first to avoid retry with old token
    resetInterceptorState();
    
    // Clear accessToken immediately to prevent interceptor from adding it to request
    useAuthStore.getState().setAccessToken(null);
    
    try {
      // Call logout API to delete refresh token cookie on server
      // Use fetch directly to avoid interceptor adding Authorization header
      await fetch(
        `${API_BASE_URL}/api${API_ENDPOINTS.auth.logout}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Send cookies
          body: JSON.stringify({}),
        }
      );
    } catch (error) {
      // Still clear auth state even if API call fails
      console.error('[AuthAPI] Logout error:', error);
    } finally {
      // Clear all auth state on client
      useAuthStore.getState().clearAuth();
    }
  }

  /**
   * Refresh token manually (usually not needed, handled automatically by interceptor)
   * Only use when you need to refresh token manually
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
        `${API_BASE_URL}/api${API_ENDPOINTS.auth.refreshToken}`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data?.token) {
        const newToken = response.data.data.token;
        useAuthStore.getState().setAccessToken(newToken);
        return newToken;
      }

      throw new Error('Không thể làm mới token');
    } catch (error) {
      // Clear auth on refresh failure
      useAuthStore.getState().clearAuth();
      throw error;
    }
  }
}

export const authAPI = new AuthAPI();
