"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Printer, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Menu,
  X,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api/auth-api"
import { toast } from "sonner"
import { useHydrated } from "@/hooks/use-hydrated"

const menuItems = [
  {
    title: "Bảng điều khiển",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Máy in",
    href: "/admin/printers",
    icon: Printer,
  },
  {
    title: "Sinh viên",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "Lịch sử in",
    href: "/admin/history",
    icon: FileText,
  },
  {
    title: "Báo cáo",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Cấu hình",
    href: "/admin/config",
    icon: Settings,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { clearAuth, user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const isHydrated = useHydrated()

  /**
   * Route Protection Logic - Strict If-Else If-Else Chain
   * 
   * Goal: Protect the /admin/* routes
   * 
   * Implementation Logic (EXACT ORDER):
   * 
   * Step 0: Hydration Check (BLOCK LOGIC)
   *   - IF !isHydrated (store not ready), do NOT run any redirect logic
   *   - Just show the Loading Spinner (return the loading UI)
   * 
   * Step 1: Get User Session
   *   - Retrieve the current user's authentication status and role
   *   - Only proceed AFTER isHydrated is true
   * 
   * Step 2: Check Authentication (Priority #1)
   *   - IF the user is NOT authenticated (logged out/no session) AND tries to access /admin/*
   *   - THEN Redirect to /login. (Do NOT redirect to /dashboard)
   * 
   * Step 3: Check Authorization (Priority #2)
   *   - ELSE IF the user IS authenticated BUT has the role 'student' AND tries to access /admin/*
   *   - THEN Redirect to /dashboard
   *   - AND Trigger a 'Permission Denied' notification/toast. (Do NOT redirect to /login)
   * 
   * Step 4: Allow Access
   *   - ELSE (User is Authenticated AND is Admin)
   *   - THEN Allow access to the route
   */
  useEffect(() => {
    // ============================================
    // STEP 0: Hydration Check (BLOCK LOGIC)
    // ============================================
    // IF !isHydrated (store not ready), do NOT run any redirect logic
    // Just show the Loading Spinner (return the loading UI)
    if (!isHydrated) {
      console.log('[AdminLayout] Step 0: Store not hydrated yet, waiting...')
      setIsChecking(true)
      return // Block all logic until hydrated
    }

    // ============================================
    // STEP 1: Get User Session
    // ============================================
    // Retrieve the current user's authentication status and role
    // Only proceed AFTER isHydrated is true
    const userIsAuthenticated = isAuthenticated && user !== null
    const userRole = user?.role

    // ============================================
    // STEP 2: Check Authentication (Priority #1)
    // ============================================
    // IF the user is NOT authenticated (logged out/no session) AND tries to access /admin/*
    // THEN Redirect to /login. (Do NOT redirect to /dashboard)
    if (!userIsAuthenticated) {
      console.log('[AdminLayout] Step 2: User NOT authenticated, redirecting to /login')
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`
      router.replace(loginUrl)
      setIsChecking(true) // Keep checking state while redirecting
      return
    }
    // ============================================
    // STEP 3: Check Authorization (Priority #2)
    // ============================================
    // ELSE IF the user IS authenticated BUT has the role 'student' AND tries to access /admin/*
    // THEN Redirect to /dashboard
    // AND Trigger a 'Permission Denied' notification/toast. (Do NOT redirect to /login)
    else if (userIsAuthenticated && userRole === 'STUDENT') {
      console.warn('[AdminLayout] Step 3: Student (authenticated) attempted to access admin route:', {
        userID: user?.userID,
        email: user?.email,
        path: pathname,
      })
      
      // Trigger 'Permission Denied' notification/toast
      toast.error("Bạn không có quyền truy cập", {
        description: "Chỉ quản trị viên mới có thể truy cập khu vực quản trị.",
        duration: 5000,
      })
      
      // Redirect to /dashboard (NOT to /login)
      router.replace("/dashboard")
      setIsChecking(true) // Keep checking state while redirecting
      return
    }
    // ============================================
    // STEP 4: Allow Access
    // ============================================
    // ELSE (User is Authenticated AND is Admin)
    // THEN Allow access to the route
    else {
      // User is authenticated AND has ADMIN role
      console.log('[AdminLayout] Step 4: Admin user authenticated, allowing access')
      setIsChecking(false)
    }
  }, [isAuthenticated, user, router, pathname, isHydrated])

  // ============================================
  // Loading UI Logic
  // ============================================
  // Show loading screen in these cases:
  // 1. !isHydrated -> Store not ready yet (BLOCK LOGIC)
  // 2. isChecking -> Still checking permissions or redirecting
  // 3. !user -> No user data (should redirect to login)
  // 4. user.role !== 'ADMIN' -> Not admin (should redirect to dashboard)
  const shouldShowLoading = !isHydrated || isChecking || !user || user.role !== 'ADMIN'
  
  if (shouldShowLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white" suppressHydrationWarning>
        <div className="text-center">
          <div className="mb-4 text-lg">Checking access permissions...</div>
          <div className="text-sm text-gray-400">Please wait...</div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    // CRITICAL: Call logout() which will redirect immediately
    // Don't await - redirect happens synchronously inside logout()
    // The function redirects immediately and returns, so nothing after this runs
    try {
      await authAPI.logout()
      // This code should never execute because logout() redirects immediately
      console.warn('[AdminLayout] Logout returned without redirecting - this should not happen!')
    } catch (error) {
      // This catch block should also never execute because redirect happens first
      console.error('[AdminLayout] Logout error (redirect should have happened):', error)
      
      // Fallback redirect - MUST include query param to prevent middleware redirect loop
      if (typeof window !== 'undefined') {
        const timestamp = Date.now()
        const loginUrl = `/login?logout=success&t=${timestamp}`
        console.log('[AdminLayout] Fallback redirect to:', loginUrl)
        window.location.href = loginUrl
      }
    }
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#1a1a1a] px-4">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  "hover:bg-[#1a1a1a] hover:text-white",
                  isActive
                    ? "bg-[#1a1a1a] text-white"
                    : "text-gray-400"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] p-4 bg-[#0a0a0a]">
          {sidebarOpen && user && (
            <div className="mb-3 text-sm">
              <p className="text-gray-400">Đăng nhập bởi</p>
              <p className="font-medium text-white">{user.email || "Admin"}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-gray-400 hover:text-white hover:bg-[#1a1a1a]",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300 overflow-auto",
          sidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        <div className="min-h-screen bg-[#0f0f0f]">
          {children}
        </div>
      </div>
    </div>
  )
}

