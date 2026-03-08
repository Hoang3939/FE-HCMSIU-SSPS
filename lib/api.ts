// Import apiClient for authenticated requests
import apiClient from './api/apiClient';
import type { ApiResponse } from './types/api.types';
import { useAuthStore } from './stores/auth-store';
import { API_BASE_URL } from './api-config';

// Get student ID from auth store (preferred) or localStorage (fallback)
function getStudentId(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from auth store first (if user is logged in)
  const user = useAuthStore.getState().user;
  if (user?.userID) {
    return user.userID;
  }
  
  // Fallback to localStorage (for demo/legacy support)
  return localStorage.getItem('student-id') || null;
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const studentId = getStudentId();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Gửi header x-student-id thay vì Authorization
  if (studentId) {
    headers['x-student-id'] = studentId;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra:\n` +
        `1. Backend có đang chạy tại ${API_BASE_URL} không?\n` +
        `2. CORS đã được cấu hình đúng chưa?\n` +
        `3. Kiểm tra console backend để xem có lỗi gì không.`
      );
    }
    // Re-throw other errors
    throw error;
  }
}

// Upload document
export async function uploadDocument(file: File): Promise<{
  message: string;
  document: {
    id: string;
    originalFileName: string;
    detectedPageCount: number;
    fileSize: number;
    uploadedAt: string;
  };
}> {
  const studentId = getStudentId();
  if (!studentId) {
    throw new Error('Thiếu Student ID. Vui lòng cung cấp Student ID.');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Don't set Content-Type for FormData - browser will set it with boundary
  const headers: HeadersInit = {
    'x-student-id': studentId,
  };

  // Tạo AbortController để có thể timeout request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 giây (2 phút) cho upload file lớn

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal, // Thêm signal để có thể abort
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: File quá lớn hoặc server xử lý quá lâu. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra backend.');
      }
      console.error('Fetch error:', error);
      throw new Error(`Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy tại ${API_BASE_URL} không.`);
    });

    clearTimeout(timeoutId); // Clear timeout nếu request thành công

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();

    // Backend returns { success: true, message: "...", data: { id, originalFileName, ... } }
    // Map to expected format: { message: "...", document: { id, originalFileName, ... } }
    if (apiResponse.success && apiResponse.data) {
      return {
        message: apiResponse.message || 'Upload thành công',
        document: {
          id: apiResponse.data.id,
          originalFileName: apiResponse.data.originalFileName,
          detectedPageCount: apiResponse.data.detectedPageCount,
          fileSize: apiResponse.data.fileSize,
          uploadedAt: apiResponse.data.uploadedAt,
        },
      };
    }

    // Fallback if structure is different
    throw new Error('Unexpected response format from server');
  } catch (error) {
    clearTimeout(timeoutId); // Đảm bảo clear timeout trong mọi trường hợp
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: File quá lớn hoặc server xử lý quá lâu. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra backend.');
    }
    throw error; // Re-throw các lỗi khác
  }
}

// Get document by ID
export async function getDocument(documentId: string) {
  return apiRequest(`/api/documents/${documentId}`);
}

// Create print job
export async function createPrintJob(data: {
  printerId: string;
  documentId: string;
  copies?: number;
  paperSize?: 'A4' | 'A3';
  side?: 'ONE_SIDED' | 'DOUBLE_SIDED';
  orientation?: 'PORTRAIT' | 'LANDSCAPE';
  pageRange?: string;
}) {
  return apiRequest<ApiResponse<{
    id: string;
    status: string;
    totalCost: number;
    message: string;
  }>>('/api/print-jobs/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get available printers
export async function getAvailablePrinters() {
  return apiRequest('/api/printers/available');
}

// Get transaction history
export async function getTransactionHistory(): Promise<{
  success: boolean;
  data: Array<{
    transID: string;
    date: string;
    amount: number;
    pagesAdded: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    paymentMethod: string | null;
    paymentRef: string | null;
  }>;
}> {
  // Use apiClient which automatically handles token refresh
  const response = await apiClient.get<ApiResponse<Array<{
    transID: string;
    date: string;
    amount: number;
    pagesAdded: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    paymentMethod: string | null;
    paymentRef: string | null;
  }>>>('/history/transactions');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể lấy lịch sử giao dịch');
  }

  return {
    success: response.data.success,
    data: response.data.data,
  };
}

// Get print history
export async function getPrintHistory(): Promise<{
  success: boolean;
  data: Array<{
    jobID: string;
    date: string;
    documentName: string;
    printerName: string;
    pagesUsed: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    cost: number;
  }>;
}> {
  // Use apiClient which automatically handles token refresh
  const response = await apiClient.get<ApiResponse<Array<{
    jobID: string;
    date: string;
    documentName: string;
    printerName: string;
    pagesUsed: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    cost: number;
  }>>>('/history/prints');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể lấy lịch sử in ấn');
  }

  return {
    success: response.data.success,
    data: response.data.data,
  };
}

// Get user balance
export async function getUserBalance() {
  const response = await apiRequest<{ success: boolean; data: { balancePages: number } }>('/api/student/balance');
  // Backend returns { success: true, data: { balancePages: number } }
  if (response.success && response.data) {
    return { balancePages: response.data.balancePages };
  }
  // Fallback if structure is different
  return response as any;
}

// Login
export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Include cookies in request and response
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || 'Đăng nhập thất bại');
  }

  const data = await response.json();

  // Save token to localStorage (for client-side use)
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  // Note: refreshToken is automatically set in HttpOnly cookie by backend
  // No need to manually set it - it's handled by the browser

  return data;
}

// Logout
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// Get current user
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Create payment transaction
export async function createPayment(data: {
  amount: number;
  pageQuantity: number;
}): Promise<{
  transId: string;
  qrUrl: string;
}> {
  try {
    // Use apiClient which handles token refresh and network errors properly
    // Backend will get studentId from JWT token (req.auth.userID)
    // No need to send x-student-id header anymore
    const response = await apiClient.post<ApiResponse<{
      transId: string;
      qrUrl: string;
    }>>('/payment/create', data);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Unexpected response format from server');
  } catch (error: any) {
    // Handle network errors with better error messages
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra:\n` +
        `1. Backend có đang chạy tại ${API_BASE_URL} không?\n` +
        `2. CORS đã được cấu hình đúng chưa?\n` +
        `3. Kiểm tra console backend để xem có lỗi gì không.`
      );
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Check payment status
export async function checkPaymentStatus(transId: string): Promise<{
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  pages: number;
}> {
  try {
    // Use apiClient which handles token refresh and network errors properly
    const response = await apiClient.get<ApiResponse<{
      status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
      pages: number;
    }>>(`/payment/status/${transId}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Unexpected response format from server');
  } catch (error: any) {
    // Handle network errors with better error messages
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra:\n` +
        `1. Backend có đang chạy tại ${API_BASE_URL} không?\n` +
        `2. CORS đã được cấu hình đúng chưa?\n` +
        `3. Kiểm tra console backend để xem có lỗi gì không.`
      );
    }
    
    // Re-throw other errors
    throw error;
  }
}

