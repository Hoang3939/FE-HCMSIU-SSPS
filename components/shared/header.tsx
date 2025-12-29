"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, LogOut, Menu, X, KeyRound } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal"

interface HeaderProps {
  userRole?: "student" | "spso"
  balance?: number
  userName?: string
}

export function Header({ userRole = "student", balance = 50, userName = "Nguyễn Văn A" }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const studentNav = [
    { href: "/dashboard", label: "Trang chủ" },
    { href: "/upload", label: "Tải lên & In" },
    { href: "/printers", label: "Máy in" },
    { href: "/history", label: "Lịch sử" },
    { href: "/buy-pages", label: "Mua trang" },
  ]

  const spsoNav = [
    { href: "/admin/dashboard", label: "Trang chủ" },
    { href: "/admin/history", label: "Lịch sử in" },
    { href: "/admin/students", label: "Quản lý sinh viên" },
    { href: "/admin/printers", label: "Quản lý máy in" },
    { href: "/admin/config", label: "Cấu hình hệ thống" },
    { href: "/admin/reports", label: "Báo cáo" },
  ]

  const navItems = userRole === "student" ? studentNav : spsoNav

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href={userRole === "student" ? "/dashboard" : "/admin/dashboard"} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
              <span className="text-sm font-bold text-white">⊜</span>
            </div>
            <span className="text-base font-semibold sm:text-lg">HCMSIU SSPS</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="text-sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {userRole === "student" && (
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span className="font-semibold text-indigo-600">{balance} trang</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-gray-500">{userRole === "student" ? "Sinh viên" : "SPSO"}</div>
              </div>
              <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Đổi mật khẩu
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <nav className="flex flex-col px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-gray-100 font-medium" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            {userRole === "student" && (
              <div className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold text-indigo-600">{balance} trang</span>
              </div>
            )}
          </nav>
        </div>
      )}

      <ChangePasswordModal open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  )
}

