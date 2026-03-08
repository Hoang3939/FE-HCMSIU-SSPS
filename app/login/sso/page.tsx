"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginSsoPlaceholderPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full rounded-2xl bg-white shadow-lg p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tính năng đang được phát triển</h1>
        <p className="text-gray-600 text-sm">
          Chức năng đăng nhập bằng HCMSIU SSO hiện đang được triển khai.
          Bạn sẽ được chuyển về trang đăng nhập sau <span className="font-semibold">5 giây</span>.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang chuyển hướng về trang đăng nhập...</span>
        </div>
      </div>
    </div>
  )
}