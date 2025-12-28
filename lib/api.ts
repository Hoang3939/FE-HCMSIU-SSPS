const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get student ID from localStorage (demo mode - không dùng login)
function getStudentId(): string | null {
  if (typeof window === 'undefined') return null;
  // Lấy từ localStorage hoặc dùng default cho demo
  return localStorage.getItem('student-id') || '87338eec-dd46-49ae-a59a-f3d61cc16915'; // student001 default
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
  return apiRequest<{
    message: string;
    job: {
      id: string;
      status: string;
      totalCost: number;
      pages: number;
      options: any;
      createdAt: string;
    };
  }>('/api/print-jobs/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get available printers
export async function getAvailablePrinters() {
  return apiRequest('/api/printers/available');
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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || 'Đăng nhập thất bại');
  }

  const data = await response.json();

  // Save token to localStorage
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

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
  const response = await apiRequest<{
    success: boolean;
    data: {
      transId: string;
      qrUrl: string;
    };
  }>('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error('Unexpected response format from server');
}

// Check payment status
export async function checkPaymentStatus(transId: string): Promise<{
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  pages: number;
}> {
  const response = await apiRequest<{
    success: boolean;
    data: {
      status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
      pages: number;
    };
  }>(`/api/payment/status/${transId}`, {
    method: 'GET',
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error('Unexpected response format from server');
}

