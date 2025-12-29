/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    verifyOTP: '/auth/verify-otp',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
  },
  printers: {
    list: '/admin/printers',
    detail: (id: string) => `/admin/printers/${id}`,
    create: '/admin/printers',
    update: (id: string) => `/admin/printers/${id}`,
    delete: (id: string) => `/admin/printers/${id}`,
  },
  admin: {
    dashboard: {
      stats: '/admin/dashboard/stats',
      recentActivities: '/admin/dashboard/recent-activities',
    },
  },
  users: {
    list: '/admin/users',
    create: '/admin/users',
    update: (id: string) => `/admin/users/${id}`,
    delete: (id: string) => `/admin/users/${id}`,
  },
} as const;


