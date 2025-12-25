/**
 * Generic API Response Interface
 * Đồng bộ với cấu trúc response từ Backend
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Pagination Interface
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: Pagination;
}

/**
 * Login Response Interface
 */
export interface LoginResponse {
  token: string; // accessToken
  refreshToken?: string; // Thường không cần vì đã có trong cookie
  user: {
    userID: string;
    username: string;
    email: string;
    role: 'STUDENT' | 'ADMIN' | 'SPSO' | 'STAFF';
  };
}

/**
 * Refresh Token Response Interface
 */
export interface RefreshTokenResponse {
  token: string; // accessToken mới
}

/**
 * Error Response Interface
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

