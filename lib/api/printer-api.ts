import apiClient from './apiClient';
import { API_ENDPOINTS } from '../api-config';
import type { ApiResponse, PaginatedApiResponse } from '../types/api.types';

/**
 * Types từ Backend API
 */
export interface Printer {
  PrinterID: string;
  Name: string;
  Brand: string | null;
  Model: string | null;
  Description: string | null;
  Status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  IPAddress: string | null;
  CUPSPrinterName: string | null;
  LocationID: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreatePrinterDto {
  Name: string;
  Brand?: string;
  Model?: string;
  Description?: string;
  Status?: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  IPAddress?: string;
  CUPSPrinterName?: string;
  LocationID?: string;
  IsActive?: boolean;
}

export interface UpdatePrinterDto {
  Name?: string;
  Brand?: string;
  Model?: string;
  Description?: string;
  Status?: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  IPAddress?: string;
  CUPSPrinterName?: string;
  LocationID?: string | null;
  IsActive?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface PrinterQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  isActive?: boolean;
}

/**
 * API Client cho Printer Management
 * Sử dụng apiClient với Axios và JWT interceptors
 */
class PrinterAPI {

  /**
   * Lấy danh sách máy in với phân trang và filter
   */
  async getPrinters(params?: PrinterQueryParams): Promise<PaginatedResponse<Printer>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.printers.list}?${queryString}`
      : API_ENDPOINTS.printers.list;

    const response = await apiClient.get<PaginatedApiResponse<Printer>>(endpoint);
    
    if (response.data.success && response.data.data && response.data.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    }

    throw new Error(response.data.message || 'Không thể lấy danh sách máy in');
  }

  /**
   * Lấy chi tiết một máy in theo ID
   */
  async getPrinterById(id: string): Promise<Printer> {
    const response = await apiClient.get<ApiResponse<Printer>>(
      API_ENDPOINTS.printers.detail(id)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Không thể lấy thông tin máy in');
  }

  /**
   * Tạo máy in mới
   */
  async createPrinter(data: CreatePrinterDto): Promise<Printer> {
    const response = await apiClient.post<ApiResponse<Printer>>(
      API_ENDPOINTS.printers.create,
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Không thể tạo máy in');
  }

  /**
   * Cập nhật thông tin máy in
   */
  async updatePrinter(id: string, data: UpdatePrinterDto): Promise<Printer> {
    const response = await apiClient.put<ApiResponse<Printer>>(
      API_ENDPOINTS.printers.update(id),
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Không thể cập nhật máy in');
  }

  /**
   * Xóa máy in
   */
  async deletePrinter(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.printers.delete(id)
    );

    if (response.data.success) {
      return { message: response.data.message || 'Xóa máy in thành công' };
    }

    throw new Error(response.data.message || 'Không thể xóa máy in');
  }
}

export const printerAPI = new PrinterAPI();

