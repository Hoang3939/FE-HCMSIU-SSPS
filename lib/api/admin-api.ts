import apiClient from './apiClient';
import axios from 'axios';
import { API_BASE_URL } from '../api-config';
import type { ApiResponse } from '../types/api.types';

/**
 * Admin Dashboard API
 */

export interface DashboardStats {
  totalPrinters: number;
  activePrinters: number;
  totalStudents: number;
  totalPrintJobs: number;
  printJobsToday: number;
  failedPrintJobs: number;
}

export interface RecentActivity {
  id: string;
  type: 'print' | 'error';
  studentId: string;
  studentName?: string;
  printerId: string;
  printerName?: string;
  pages: number;
  status: 'success' | 'failed';
  createdAt: string;
  timeAgo: string;
}

/**
 * Lấy thống kê tổng quan cho Dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<ApiResponse<DashboardStats>>(
    '/admin/dashboard/stats'
  );
  return response.data.data!;
}

/**
 * Lấy các hoạt động in ấn gần đây
 */
export async function getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  const response = await apiClient.get<ApiResponse<RecentActivity[]>>(
    `/admin/dashboard/recent-activities?limit=${limit}`
  );
  return response.data.data!;
}

// ====== SYSTEM CONFIGURATION API ======

export interface SystemConfig {
  default_page_balance: number;
  allowed_file_types: string[];
  max_file_size_mb: number;
  price_per_page: number;
  semester_dates: {
    semester1: string; // ISO8601 format - Học kỳ 1
    semester2: string; // ISO8601 format - Học kỳ 2
    semester3: string; // ISO8601 format - Học kỳ phụ
  };
}

export interface UpdateSystemConfigRequest {
  default_page_balance?: number;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
  price_per_page?: number;
  semester_dates?: {
    semester1?: string;
    semester2?: string;
    semester3?: string;
  };
}

/**
 * Lấy cấu hình hệ thống hiện tại
 */
/**
 * Lấy thông tin giới hạn upload (public, không cần authentication)
 * Dùng cho student khi upload file
 */
export async function getUploadLimits(): Promise<{
  max_file_size_mb: number;
  allowed_file_types: string[];
  price_per_page: number;
}> {
  try {
    console.log('[admin-api] Calling GET /config/upload-limits (public endpoint)');
    // Sử dụng axios trực tiếp thay vì apiClient để tránh authentication interceptor
    const response = await axios.get<ApiResponse<{
      max_file_size_mb: number;
      allowed_file_types: string[];
      price_per_page: number;
    }>>(`${API_BASE_URL}/api/config/upload-limits`);
    console.log('[admin-api] GET /config/upload-limits successful:', response.data);
    return response.data.data!;
  } catch (error: any) {
    console.error('[admin-api] Error getting upload limits:', error);
    // Không throw error, chỉ log và trả về default values
    // Vì đây là public endpoint và có thể không có config trong database
    console.warn('[admin-api] Using default upload limits');
    return {
      max_file_size_mb: 100,
      allowed_file_types: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'],
      price_per_page: 500,
    };
  }
}

export async function getSystemConfigs(): Promise<SystemConfig> {
  try {
    console.log('[admin-api] Calling GET /admin/configs');
    const response = await apiClient.get<ApiResponse<SystemConfig>>(
      '/admin/configs'
    );
    console.log('[admin-api] GET /admin/configs successful:', response.data);
    return response.data.data!;
  } catch (error: any) {
    console.error('[admin-api] Error getting system configs:', error);
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.');
    }
    if (error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập trang này.');
    }
    if (error.response?.status === 404) {
      throw new Error('API endpoint không tồn tại. Vui lòng kiểm tra backend routes.');
    }
    throw error;
  }
}

/**
 * Cập nhật cấu hình hệ thống
 */
export async function updateSystemConfigs(
  updates: UpdateSystemConfigRequest
): Promise<SystemConfig> {
  try {
    console.log('[admin-api] Calling PUT /admin/configs with:', updates);
    const response = await apiClient.put<ApiResponse<SystemConfig>>(
      '/admin/configs',
      updates
    );
    console.log('[admin-api] PUT /admin/configs successful:', response.data);
    return response.data.data!;
  } catch (error: any) {
    console.error('[admin-api] Error updating system configs:', error);
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.');
    }
    if (error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập trang này.');
    }
    if (error.response?.status === 400) {
      const message = error.response?.data?.message || 'Dữ liệu không hợp lệ';
      throw new Error(message);
    }
    throw error;
  }
}

/**
 * Reset số trang về mặc định cho tất cả sinh viên
 */
export async function resetStudentPages(): Promise<{ resetCount: number }> {
  try {
    console.log('[admin-api] Calling POST /admin/configs/reset-pages');
    const response = await apiClient.post<ApiResponse<{ resetCount: number }>>(
      '/admin/configs/reset-pages'
    );
    console.log('[admin-api] POST /admin/configs/reset-pages successful:', response.data);
    return response.data.data!;
  } catch (error: any) {
    console.error('[admin-api] Error resetting student pages:', error);
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.');
    }
    if (error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập trang này.');
    }
    throw error;
  }
}

