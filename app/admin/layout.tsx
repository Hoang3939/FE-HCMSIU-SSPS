"use client"

import { useState } from "react"
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
  const { clearAuth, user } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push("/login")
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

