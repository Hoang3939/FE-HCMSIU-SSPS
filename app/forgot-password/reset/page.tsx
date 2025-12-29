"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react"
import { authAPI } from "@/lib/api/auth-api"
import { toast } from "sonner"

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userID, setUserID] = useState("")
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const userIDParam = searchParams.get("userID")
    const emailParam = searchParams.get("email")
    if (userIDParam && emailParam) {
      setUserID(userIDParam)
      setEmail(emailParam)
    } else {
      router.push("/forgot-password")
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)

    try {
      await authAPI.resetPassword(userID, newPassword, confirmPassword)
      toast.success("Đổi mật khẩu thành công")
      // Chuyển về trang login sau 1 giây
      setTimeout(() => {
        router.push("/login?passwordChanged=success")
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "Không thể đặt lại mật khẩu")
    } finally {
      setLoading(false)
    }
  }

  if (!userID || !email) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Lock className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nhập mật khẩu mới cho tài khoản <span className="font-semibold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-12 pr-10"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 pr-10"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={loading || newPassword !== confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu mật khẩu"
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

