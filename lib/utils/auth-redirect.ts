/**
 * Auth Redirect Utility
 * Xử lý logic điều hướng sau khi đăng nhập dựa trên role
 */

import type { User } from "@/lib/stores/auth-store"

/**
 * Xác định URL redirect sau khi đăng nhập dựa trên role
 * 
 * @param user - User object từ auth store
 * @param redirectUrl - URL redirect từ query params (nếu có)
 * @returns URL để redirect
 */
export function getRedirectUrlAfterLogin(
  user: User | null,
  redirectUrl: string | null
): string {
  if (!user) {
    return '/login'
  }

  const role = user.role

  // Xử lý redirect dựa trên role
  if (role === 'ADMIN') {
    // ADMIN: Nếu có redirect URL và là admin route, về đó; không thì về /admin/dashboard
    if (redirectUrl && redirectUrl.startsWith('/admin')) {
      return redirectUrl
    }
    return '/admin/dashboard'
  } else if (role === 'STUDENT') {
    // STUDENT: Luôn về /dashboard (hoặc /student nếu có)
    // Bỏ qua redirectUrl nếu là admin route
    if (redirectUrl && redirectUrl.startsWith('/admin')) {
      // STUDENT cố truy cập admin URL, bỏ qua và về dashboard
      return '/dashboard'
    }
    // Nếu có redirectUrl hợp lệ (không phải admin), có thể dùng
    return redirectUrl || '/dashboard'
  }

  // Role không hợp lệ, về trang chủ
  return '/'
}

/**
 * Kiểm tra xem user có quyền truy cập route không
 * 
 * @param user - User object từ auth store
 * @param allowedRoles - Danh sách roles được phép
 * @returns true nếu có quyền, false nếu không
 */
export function hasPermission(
  user: User | null,
  allowedRoles: ('STUDENT' | 'ADMIN')[]
): boolean {
  if (!user) {
    return false
  }

  return allowedRoles.includes(user.role)
}

/**
 * Lấy thông báo lỗi khi không có quyền truy cập
 * 
 * @param userRole - Role của user hiện tại
 * @param requiredRole - Role yêu cầu
 * @returns Thông báo lỗi
 */
export function getUnauthorizedMessage(
  userRole: string | undefined,
  requiredRole: string = 'quản trị viên'
): string {
  if (userRole === 'STUDENT') {
    return `Bạn không đủ quyền truy cập. Chỉ ${requiredRole} mới có thể truy cập trang này.`
  }
  return 'Bạn không có quyền truy cập trang này.'
}

