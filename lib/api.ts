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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Gửi header x-student-id thay vì Authorization
  if (studentId) {
    headers['x-student-id'] = studentId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
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

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers,
    body: formData,
  }).catch((error) => {
    console.error('Fetch error:', error);
    throw new Error(`Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy tại ${API_BASE_URL} không.`);
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
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
  return apiRequest<{ balancePages: number }>('/api/student/balance');
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

