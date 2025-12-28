"use client"

import type React from "react"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { authAPI } from "@/lib/api/auth-api"
import { useToast } from "@/hooks/use-toast"
import { toast as sonnerToast } from "sonner"
import { getRedirectUrlAfterLogin } from "@/lib/utils/auth-redirect"

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  /**
   * Xử lý logic đăng nhập và điều hướng dựa trên role
   * Kịch bản 3: Xử lý tại trang Đăng nhập (Login Flow)
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Gọi API đăng nhập xuống Backend
      const response = await authAPI.login({
        username: username.trim(),
        password,
      })

      // Lấy redirect URL từ query params (nếu có)
      const redirectUrl = searchParams.get('redirect')
      const role = response.user.role

      console.log('[Login] Login successful, handling redirect:', {
        role,
        redirectUrl,
        userID: response.user.userID,
      })

      // Xử lý trường hợp đặc biệt: Student đăng nhập với redirect URL là /admin
      if (role === "STUDENT" && redirectUrl && redirectUrl.startsWith("/admin")) {
        // STUDENT cố truy cập admin URL sau khi đăng nhập
        // Hiển thị thông báo lỗi: "Bạn không đủ quyền hạn"
        sonnerToast.error("Bạn không đủ quyền hạn", {
          description: "Chỉ quản trị viên mới có thể truy cập trang quản lý.",
          duration: 5000,
        })
        
        // Redirect về Student Dashboard ngay lập tức
        router.push("/dashboard")
        return
      }

      // Các trường hợp khác: Hiển thị thông báo thành công
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${response.user.username}!`,
      })

      // Sử dụng utility function để lấy URL redirect phù hợp
      const finalRedirectUrl = getRedirectUrlAfterLogin(response.user, redirectUrl)
      router.push(finalRedirectUrl)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      setError(errorMessage)
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" suppressHydrationWarning>
      {/* Left Side - Illustration */}
      <div className="hidden flex-1 items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 lg:flex" suppressHydrationWarning>
        <div className="max-w-md space-y-8 p-8 sm:p-12" suppressHydrationWarning>
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black" suppressHydrationWarning>
              <span className="text-lg font-bold text-white">⊜</span>
            </div>
            <span className="text-xl font-bold">HCMSIU SSPS</span>
          </div>
          <div suppressHydrationWarning>
            <h1 className="text-balance text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
              Đăng nhập vào
            </h1>
            <p className="mt-2 text-xl font-semibold text-gray-700 sm:text-2xl">HCMSIU SSPS</p>
          </div>
          <div className="flex justify-center" suppressHydrationWarning>
            <img src="/images/image.png" alt="Student illustration" className="max-w-sm" />
          </div>
          <div className="rounded-lg bg-white/50 p-4 text-sm text-gray-700" suppressHydrationWarning>
            <p className="font-semibold">Xác thực qua HCMSIU SSO</p>
            <p className="mt-1">Sử dụng tài khoản sinh viên của bạn để đăng nhập</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-8" suppressHydrationWarning>
        <div className="w-full max-w-md space-y-8" suppressHydrationWarning>
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 lg:hidden" suppressHydrationWarning>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black" suppressHydrationWarning>
              <span className="text-lg font-bold text-white">⊜</span>
            </div>
            <span className="text-xl font-bold">HCMSIU SSPS</span>
          </div>

          <div suppressHydrationWarning>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Đăng nhập</h2>
            <p className="mt-2 text-sm text-gray-600">Sử dụng tài khoản HCMSIU SSO</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" suppressHydrationWarning>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3" suppressHydrationWarning>
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập hoặc email</Label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập hoặc email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-purple-50 border-purple-100 placeholder:text-purple-300"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-purple-50 border-purple-100 pr-12 placeholder:text-purple-300"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="#" className="text-sm text-purple-400 hover:text-purple-600">
                Quên mật khẩu ?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>Hoặc</p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  // Simulate SSO redirect
                  window.location.href = "#"
                }}
              >
                Đăng nhập bằng HCMSIU SSO
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

