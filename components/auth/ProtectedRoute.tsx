"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "sonner"
import { useHydrated } from "@/hooks/use-hydrated"

/**
 * ProtectedRoute Component
 * Bảo vệ routes dựa trên authentication và authorization
 * 
 * @param children - Component con cần được bảo vệ
 * @param allowedRoles - Danh sách roles được phép truy cập (mặc định: ['STUDENT', 'ADMIN'])
 * @param redirectTo - URL redirect khi không có quyền (mặc định: '/login')
 */
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('STUDENT' | 'ADMIN')[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['STUDENT', 'ADMIN'],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const isHydrated = useHydrated()

  useEffect(() => {
    // Chỉ chạy sau khi component đã hydrate ở client
    if (!isHydrated) return

    // Kiểm tra authentication
    if (!isAuthenticated || !user) {
      console.log('[ProtectedRoute] User not authenticated, redirecting to login')
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`
      router.replace(loginUrl)
      return
    }

    // Kiểm tra authorization (role)
    if (!allowedRoles.includes(user.role)) {
      console.warn('[ProtectedRoute] Unauthorized access attempt:', {
        userID: user.userID,
        role: user.role,
        allowedRoles,
        path: pathname,
      })

      // Hiển thị thông báo lỗi
      toast.error("Bạn không đủ quyền truy cập", {
        description: "Bạn không có quyền truy cập trang này.",
        duration: 5000,
      })

      // Redirect dựa trên role của user
      if (user.role === 'STUDENT') {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
      return
    }

    // Cho phép truy cập
    setIsChecking(false)
  }, [isAuthenticated, user, allowedRoles, pathname, router, redirectTo, isHydrated])

  // Hiển thị loading khi đang kiểm tra hoặc chưa hydrate
  if (!isHydrated || isChecking || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" suppressHydrationWarning>
        <div className="text-center">
          <div className="mb-4 text-lg font-medium text-gray-900">
            Đang kiểm tra quyền truy cập...
          </div>
          <div className="text-sm text-gray-500">Vui lòng đợi...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

