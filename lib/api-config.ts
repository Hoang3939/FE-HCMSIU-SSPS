/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    refreshToken: '/api/auth/refresh-token',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    verifyOTP: '/api/auth/verify-otp',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
  },
  printers: {
    list: '/api/admin/printers',
    detail: (id: string) => `/api/admin/printers/${id}`,
    create: '/api/admin/printers',
    update: (id: string) => `/api/admin/printers/${id}`,
    delete: (id: string) => `/api/admin/printers/${id}`,
  },
  admin: {
    dashboard: {
      stats: '/api/admin/dashboard/stats',
      recentActivities: '/api/admin/dashboard/recent-activities',
    },
  },
  users: {
    list: '/api/admin/users',
    create: '/api/admin/users',
    update: (id: string) => `/api/admin/users/${id}`,
    delete: (id: string) => `/api/admin/users/${id}`,
  },
} as const;


