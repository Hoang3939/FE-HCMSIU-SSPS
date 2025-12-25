import { API_BASE_URL, API_ENDPOINTS } from '../api-config';

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
 */
class PrinterAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

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

    return this.request<PaginatedResponse<Printer>>(endpoint);
  }

  /**
   * Lấy chi tiết một máy in theo ID
   */
  async getPrinterById(id: string): Promise<Printer> {
    return this.request<Printer>(API_ENDPOINTS.printers.detail(id));
  }

  /**
   * Tạo máy in mới
   */
  async createPrinter(data: CreatePrinterDto): Promise<Printer> {
    return this.request<Printer>(API_ENDPOINTS.printers.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Cập nhật thông tin máy in
   */
  async updatePrinter(id: string, data: UpdatePrinterDto): Promise<Printer> {
    return this.request<Printer>(API_ENDPOINTS.printers.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Xóa máy in
   */
  async deletePrinter(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.printers.delete(id), {
      method: 'DELETE',
    });
  }
}

export const printerAPI = new PrinterAPI();

