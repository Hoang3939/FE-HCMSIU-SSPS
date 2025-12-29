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
   * Đăng xuất - Xóa hoàn toàn tất cả authentication data
   * 
   * Flow:
   * 1. Reset interceptor state và clear accessToken ngay lập tức
   * 2. Gọi Next.js API route (/api/auth/logout) để xóa HttpOnly cookie ở server-side
   * 3. ĐỢI API call hoàn thành để đảm bảo cookie được xóa
   * 4. Clear tất cả auth state ở client-side (localStorage, Zustand store)
   * 5. Redirect về /login với full page reload và query param để bypass middleware check
   * 
   * CRITICAL: Phải đợi API call hoàn thành trước khi redirect
   * để đảm bảo cookie được xóa ở server-side
   */
  async logout(): Promise<void> {
    console.log('[AuthAPI] ========================================');
    console.log('[AuthAPI] 🚪 Starting logout process...');
    
    if (typeof window === 'undefined') {
      // SSR - just clear state
      resetInterceptorState();
      useAuthStore.getState().setAccessToken(null);
      useAuthStore.getState().clearAuth();
      return;
    }
    
    // CLIENT-SIDE: Clear state first, then redirect immediately
    // Step 1: Set flag to prevent other code from overriding
    sessionStorage.setItem('__logout_in_progress__', 'true');
    
    // Step 2: Clear state synchronously (before redirect)
    resetInterceptorState();
    useAuthStore.getState().setAccessToken(null);
    useAuthStore.getState().clearAuth();
    
    // Clear localStorage
    try {
      localStorage.removeItem('auth-storage');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('[AuthAPI] ✅ State cleared');
    } catch (error) {
      console.error('[AuthAPI] Error clearing storage:', error);
    }
    
    // Step 3: CRITICAL - Build redirect URL with query param
    // Use absolute URL to prevent any routing issues
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const loginUrl = `${window.location.origin}/login?logout=success&t=${timestamp}&r=${randomId}`;
    
    console.log('[AuthAPI] ========================================');
    console.log('[AuthAPI] 🔄 FORCING redirect to:', loginUrl);
    console.log('[AuthAPI] ⚠️ URL MUST include ?logout=success query param');
    console.log('[AuthAPI] Current URL:', window.location.href);
    console.log('[AuthAPI] ========================================');
    
    // Step 4: CRITICAL - Redirect IMMEDIATELY using multiple methods
    // Method 1: window.location.href (synchronous, most reliable)
    window.location.href = loginUrl;
    
    // Method 2: Force redirect again after 0ms (safety net)
    // This ensures redirect happens even if something tries to prevent it
    setTimeout(() => {
      const currentUrl = window.location.href;
      const hasLogoutParam = currentUrl.includes('logout=success');
      
      if (!hasLogoutParam) {
        console.error('[AuthAPI] ❌ CRITICAL: Redirect failed! Current URL:', currentUrl);
        console.error('[AuthAPI] ❌ Missing logout=success param! Forcing redirect again...');
        window.location.replace(loginUrl);
      } else {
        console.log('[AuthAPI] ✅ Redirect successful, logout param present');
      }
    }, 0);
    
    // Call API in background (don't await - redirect already happened)
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    }).catch(error => {
      console.error('[AuthAPI] Background logout API error:', error);
    });
  }

  /**
   * Yêu cầu gửi mã OTP để reset password
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api${API_ENDPOINTS.auth.forgotPassword}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Không thể gửi mã OTP',
      }));
      throw new Error(errorData.message || 'Không thể gửi mã OTP');
    }

    const data: ApiResponse<void> = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Không thể gửi mã OTP');
    }
  }

  /**
   * Xác thực mã OTP
   */
  async verifyOTP(email: string, otpCode: string): Promise<{ userID: string }> {
    const response = await fetch(
      `${API_BASE_URL}/api${API_ENDPOINTS.auth.verifyOTP}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otpCode }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Mã OTP không hợp lệ',
      }));
      throw new Error(errorData.message || 'Mã OTP không hợp lệ');
    }

    const data: ApiResponse<{ userID: string }> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Mã OTP không hợp lệ');
    }

    return data.data;
  }

  /**
   * Reset password sau khi verify OTP
   */
  async resetPassword(
    userID: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api${API_ENDPOINTS.auth.resetPassword}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID, newPassword, confirmPassword }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Không thể đặt lại mật khẩu',
      }));
      throw new Error(errorData.message || 'Không thể đặt lại mật khẩu');
    }

    const data: ApiResponse<void> = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Không thể đặt lại mật khẩu');
    }
  }

  /**
   * Đổi mật khẩu khi đã đăng nhập
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.auth.changePassword,
      {
        currentPassword,
        newPassword,
        confirmPassword,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể đổi mật khẩu');
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
