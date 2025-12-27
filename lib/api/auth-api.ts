import apiClient, { resetInterceptorState } from './apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../api-config';
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
    // Reset interceptor state trước khi login để tránh xung đột với token cũ
    resetInterceptorState();
    
    // Clear auth state cũ trước khi login
    useAuthStore.getState().clearAuth();
    
    // Sử dụng axios trực tiếp để tránh interceptor thêm Authorization header cũ
    const axios = (await import('axios')).default;
    const response = await axios.post<ApiResponse<LoginResponse>>(
      `${API_BASE_URL}/api${API_ENDPOINTS.auth.login}`,
      credentials,
      {
        withCredentials: true,
      }
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
    // Reset interceptor state trước để tránh retry với token cũ
    resetInterceptorState();
    
    // Clear accessToken ngay lập tức để tránh interceptor thêm vào request
    useAuthStore.getState().setAccessToken(null);
    
    try {
      // Gọi API logout để xóa refresh token cookie ở server
      // Sử dụng axios trực tiếp để tránh interceptor thêm Authorization header
      const axios = (await import('axios')).default;
      await axios.post(
        `${API_BASE_URL}/api${API_ENDPOINTS.auth.logout}`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      // Vẫn xóa auth state dù API có lỗi
      console.error('Logout error:', error);
    } finally {
      // Xóa toàn bộ auth state ở client
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

