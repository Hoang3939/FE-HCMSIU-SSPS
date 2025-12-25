/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  printers: {
    list: '/api/admin/printers',
    detail: (id: string) => `/api/admin/printers/${id}`,
    create: '/api/admin/printers',
    update: (id: string) => `/api/admin/printers/${id}`,
    delete: (id: string) => `/api/admin/printers/${id}`,
  },
} as const;

