"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, KeyRound } from "lucide-react"
import { authAPI } from "@/lib/api/auth-api"
import { toast } from "sonner"

export default function VerifyOTPPage() {
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else {
      router.push("/forgot-password")
    }
  }, [searchParams, router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Chỉ cho phép 1 ký tự
    if (!/^\d*$/.test(value)) return // Chỉ cho phép số

    const newOtp = [...otpCode]
    newOtp[index] = value
    setOtpCode(newOtp)

    // Tự động chuyển sang ô tiếp theo
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("")
      setOtpCode(newOtp)
      const lastInput = document.getElementById(`otp-5`)
      lastInput?.focus()
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email không hợp lệ")
      return
    }

    setResending(true)
    try {
      await authAPI.forgotPassword(email)
      toast.success("Mã OTP mới đã được gửi đến email của bạn")
      // Reset OTP inputs
      setOtpCode(["", "", "", "", "", ""])
      document.getElementById("otp-0")?.focus()
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi lại mã OTP")
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otpCode.join("")
    
    if (fullOtp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ 6 chữ số")
      return
    }

    setLoading(true)

    try {
      const result = await authAPI.verifyOTP(email, fullOtp)
      toast.success("Mã OTP hợp lệ")
      // Chuyển sang trang reset password với userID
      router.push(`/forgot-password/reset?userID=${result.userID}&email=${encodeURIComponent(email)}`)
    } catch (error: any) {
      toast.error(error.message || "Mã OTP không hợp lệ hoặc đã hết hạn")
      // Reset OTP inputs
      setOtpCode(["", "", "", "", "", ""])
      document.getElementById("otp-0")?.focus()
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <KeyRound className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nhập mã OTP</h1>
          <p className="mt-2 text-sm text-gray-600">
            Mã OTP đã được gửi đến <span className="font-semibold">{email}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Mã OTP có hiệu lực trong 5 phút
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Mã OTP (6 chữ số)</Label>
            <div className="flex gap-2">
              {otpCode.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-14 text-center text-2xl font-semibold"
                  required
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={loading || otpCode.join("").length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              "Tiếp tục"
            )}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending || !email}
            className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi lại mã OTP"
            )}
          </button>
          <div>
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
    </div>
  )
}

