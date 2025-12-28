import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth-store';
import { API_ENDPOINTS, API_BASE_URL } from '../api-config';
import type { ApiResponse, RefreshTokenResponse } from '../types/api.types';

/**
 * Axios Instance với cấu hình global
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Required: Automatically send refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Queue để lưu các request bị lỗi 401, sẽ retry sau khi refresh token thành công
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

/**
 * Hàm xử lý queue các request bị lỗi
 */
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Reset interceptor state (dùng khi logout)
 */
export const resetInterceptorState = () => {
  isRefreshing = false;
  processQueue(new AxiosError('Logout: Request cancelled'), null);
};

/**
 * Request Interceptor
 * Tự động lấy accessToken từ Zustand store và gắn vào Header Authorization
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    
    // Only add Authorization header if token exists and config has headers
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Xử lý lỗi 401 với cơ chế Silent Refresh Token
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Skip refresh logic for auth endpoints to avoid infinite loops
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    
    // Only handle 401 errors for non-auth endpoints and if not already retried
    if (
      error.response?.status === 401 && 
      originalRequest && 
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint using axios directly to avoid interceptor loop
        // Refresh token is automatically sent via cookie (withCredentials: true)
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

        const newAccessToken = response.data.data?.token;
        
        if (!newAccessToken) {
          throw new Error('No access token received from refresh endpoint');
        }

        // Update accessToken in store
        useAuthStore.getState().setAccessToken(newAccessToken);
        
        // Update original request header with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        // Process queue: resolve all waiting requests
        processQueue(null, newAccessToken);
        
        isRefreshing = false;
        
        // Retry original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed
        isRefreshing = false;
        processQueue(refreshError as AxiosError, null);
        
        // Log the error for debugging
        const axiosError = refreshError as AxiosError;
        const errorStatus = axiosError.response?.status;
        const isAuthError = errorStatus === 401 || errorStatus === 403;
        const isNetworkError = axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ECONNABORTED';
        
        if (isAuthError) {
          console.warn('[apiClient] Refresh token expired or invalid. Redirecting to login.');
        } else {
          console.error('[apiClient] Error refreshing token (non-auth error):', {
            status: errorStatus,
            code: axiosError.code,
            message: axiosError.message,
            data: axiosError.response?.data,
          });
        }
        
        // Clear auth state and redirect to login
        useAuthStore.getState().clearAuth();
        
        // Only redirect if on client-side (browser)
        if (typeof window !== 'undefined') {
          // Check if logout is in progress - if so, don't override the redirect
          const isLogoutInProgress = sessionStorage.getItem('__logout_in_progress__') === 'true';
          
          if (isLogoutInProgress) {
            console.log('[ApiClient] Logout in progress, skipping auto-redirect to avoid override');
            return Promise.reject(refreshError);
          }
          
          // Avoid redirect loops - only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            // CRITICAL: Include query param to prevent middleware redirect loop
            const timestamp = Date.now();
            const loginUrl = `/login?logout=success&t=${timestamp}`;
            console.log('[ApiClient] Auto-redirecting to login:', loginUrl);
            window.location.href = loginUrl;
        // Chỉ clear auth và redirect nếu là lỗi auth (401, 403)
        // Không redirect nếu là lỗi server (500) hoặc network
        if (isAuthError) {
          // Clear auth state and redirect to login
          useAuthStore.getState().clearAuth();
          
          // Only redirect if on client-side (browser)
          if (typeof window !== 'undefined') {
            // Avoid redirect loops - only redirect if not already on login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        } else {
          // Nếu là lỗi server hoặc network, không redirect
          // Chỉ reject error để component có thể xử lý
          console.warn('[apiClient] Refresh token failed but not auth error. Not redirecting.');
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('[apiClient] Network Error:', {
        message: error.message,
        code: error.code,
        baseURL: apiClient.defaults.baseURL,
        url: error.config?.url,
        fullUrl: error.config ? `${apiClient.defaults.baseURL}${error.config.url}` : 'unknown',
      });
      
      const networkError = new Error(
        `Cannot connect to backend server. Please ensure the backend is running at ${API_BASE_URL}`
      );
      (networkError as any).code = error.code;
      (networkError as any).originalError = error;
      return Promise.reject(networkError);
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default apiClient;
