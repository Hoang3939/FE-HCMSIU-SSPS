import apiClient from './apiClient';
import { API_ENDPOINTS } from '../api-config';
import type { ApiResponse, LoginResponse } from '../types/api.types';
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
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.auth.login,
      credentials
    );

    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      
      // Lưu accessToken và user vào store
      useAuthStore.getState().setAuth(token, user);
      
      return response.data.data;
    }

    throw new Error(response.data.message || 'Đăng nhập thất bại');
  }

  /**
   * Đăng xuất
   * Refresh token sẽ được xóa tự động bởi server (HttpOnly cookie)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } catch (error) {
      // Vẫn xóa auth state dù API có lỗi
      console.error('Logout error:', error);
    } finally {
      // Xóa auth state ở client
      useAuthStore.getState().clearAuth();
    }
  }

  /**
   * Refresh token (thường không cần gọi trực tiếp, đã được xử lý tự động bởi interceptor)
   * Chỉ dùng khi cần refresh token thủ công
   */
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      API_ENDPOINTS.auth.refreshToken,
      {}
    );

    if (response.data.success && response.data.data?.token) {
      const newToken = response.data.data.token;
      useAuthStore.getState().setAccessToken(newToken);
      return newToken;
    }

    throw new Error('Không thể làm mới token');
  }
}

export const authAPI = new AuthAPI();

