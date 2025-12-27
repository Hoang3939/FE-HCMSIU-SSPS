import apiClient from './apiClient';
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

