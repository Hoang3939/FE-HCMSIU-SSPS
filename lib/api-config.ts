/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
  },
  printers: {
    list: '/admin/printers',
    detail: (id: string) => `/admin/printers/${id}`,
    create: '/admin/printers',
    update: (id: string) => `/admin/printers/${id}`,
    delete: (id: string) => `/admin/printers/${id}`,
  },
} as const;

