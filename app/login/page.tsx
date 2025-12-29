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
    <div className="min-h-screen bg-white relative overflow-hidden" suppressHydrationWarning>
      {/* Background: Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #E2E8F0 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        suppressHydrationWarning
      />

      {/* Background: Large Colored Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" suppressHydrationWarning>
        {/* Circle behind character - Purple */}
        <div 
          className="absolute -left-[300px] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: '#D6BCFA',
            filter: 'blur(120px)',
          }}
          suppressHydrationWarning
        />
        {/* Circle behind form - Lavender Blue */}
        <div 
          className="absolute -right-[300px] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: '#A5B4FC',
            filter: 'blur(120px)',
          }}
          suppressHydrationWarning
        />
        {/* Additional circle for depth */}
        <div 
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'linear-gradient(135deg, #D6BCFA 0%, #A5B4FC 100%)',
            filter: 'blur(100px)',
          }}
          suppressHydrationWarning
        />
      </div>

      {/* Header with Logo */}
      <div className="relative z-10 flex items-center gap-3 p-6" suppressHydrationWarning>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black" suppressHydrationWarning>
          <span className="text-lg font-bold text-white">⊜</span>
        </div>
        <span className="text-xl font-bold">HCMSIU SSPS</span>
      </div>

      {/* Main Content - Centered Layout */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 min-h-[calc(100vh-80px)]" suppressHydrationWarning>
        {/* Illustration and Form Row - Centered */}
        <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-12 lg:flex-row" suppressHydrationWarning>
          {/* Left Side - 3D Illustration with Floating Animation */}
          <div className="flex flex-1 items-center justify-center" suppressHydrationWarning>
            <div className="relative">
              <img 
                src="/images/image.png" 
                alt="Student illustration" 
                className="max-w-xs w-full h-auto object-contain lg:max-w-sm relative z-10 animate-float" 
              />
              {/* Drop shadow for character */}
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
                  filter: 'blur(12px)',
                  transform: 'translateX(-50%) translateY(20px)',
                }}
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Right Side - Login Form with Glassmorphism */}
          <div className="flex-1 w-full max-w-md" suppressHydrationWarning>
            <div 
              className="space-y-6 p-8 rounded-2xl backdrop-blur-[10px] border border-white/50"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px 0 rgba(77, 71, 195, 0.15)',
              }}
              suppressHydrationWarning
            >
              {/* Form Title */}
              <h2 className="text-2xl font-bold text-gray-900">Đăng nhập</h2>

              <form onSubmit={handleLogin} className="space-y-5" suppressHydrationWarning>
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3" suppressHydrationWarning>
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Username/Email Input - No Label, Placeholder only */}
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập email hoặc tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 bg-[#F0EFFF] border-none rounded-lg text-[#A7A3FF] placeholder:text-[#A7A3FF] focus-visible:ring-2 focus-visible:ring-[#4D47C3] focus-visible:ring-offset-0 transition-all duration-300 focus-visible:shadow-[0_0_0_4px_rgba(77,71,195,0.1)]"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password Input - No Label, Placeholder only */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-[#F0EFFF] border-none rounded-lg text-[#A7A3FF] placeholder:text-[#A7A3FF] pr-12 focus-visible:ring-2 focus-visible:ring-[#4D47C3] focus-visible:ring-offset-0 transition-all duration-300 focus-visible:shadow-[0_0_0_4px_rgba(77,71,195,0.1)]"
                      required
                      disabled={loading}
                    />
                    {/* Eye Icon - Purple color */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7A3FF] hover:text-[#4D47C3] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Forgot Password Link - Small, gray, aligned right below input */}
                  <div className="text-right">
                    <Link 
                      href="#" 
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>

                {/* Main Login Button */}
                <Button 
                  type="submit" 
                  className="h-12 w-full bg-[#4D47C3] text-white hover:bg-[#3d37a3] hover:shadow-lg transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Divider */}
                <div className="relative my-6" suppressHydrationWarning>
                  <div className="absolute inset-0 flex items-center" suppressHydrationWarning>
                    <div className="w-full border-t border-gray-200/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm" suppressHydrationWarning>
                    <span 
                      className="px-2 text-gray-500"
                      style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      Hoặc
                    </span>
                  </div>
                </div>

                {/* SSO Login Button - Secondary style */}
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full bg-white border border-[#D6BCFA] text-[#4D47C3] hover:bg-[#F0EFFF] hover:border-[#4D47C3] rounded-lg transition-all duration-300"
                  onClick={() => {
                    // Simulate SSO redirect
                    window.location.href = "#"
                  }}
                >
                  Đăng nhập bằng HCMSIU SSO
                </Button>
              </form>
            </div>
          </div>
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

