import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth-store';
import { API_ENDPOINTS, API_BASE_URL } from '../api-config';
import type { ApiResponse, RefreshTokenResponse } from '../types/api.types';

/**
 * Axios Instance với cấu hình global
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Bắt buộc: Tự động gửi kèm Refresh Token (Cookie)
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
  // Reject tất cả request đang chờ trong queue
  processQueue(new AxiosError('Logout: Request cancelled'), null);
};

/**
 * Request Interceptor
 * Tự động lấy accessToken từ Zustand store và gắn vào Header Authorization
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    
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
    
    // Chỉ xử lý lỗi 401 và chưa retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Nếu đang refresh token, thêm request vào queue
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
        // Gọi API refresh token
        // Sử dụng axios trực tiếp để tránh vòng lặp vô hạn với interceptor
        // Refresh token sẽ tự động gửi kèm trong cookie (withCredentials: true)
        const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
          `${API_BASE_URL}/api${API_ENDPOINTS.auth.refreshToken}`,
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken = response.data.data?.token;
        
        if (newAccessToken) {
          // Cập nhật accessToken mới vào store
          useAuthStore.getState().setAccessToken(newAccessToken);
          
          // Retry request ban đầu với token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          
          // Xử lý queue: resolve tất cả các request đang chờ
          processQueue(null, newAccessToken);
          
          isRefreshing = false;
          
          return apiClient(originalRequest);
        } else {
          throw new Error('Không nhận được access token mới');
        }
      } catch (refreshError) {
        // Refresh token thất bại
        isRefreshing = false;
        processQueue(refreshError as AxiosError, null);
        
        // Xóa thông tin user và điều hướng về trang login
        useAuthStore.getState().clearAuth();
        
        // Chỉ redirect nếu đang ở client-side (browser)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Xử lý các lỗi khác
    return Promise.reject(error);
  }
);

export default apiClient;

