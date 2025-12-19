"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate SSO authentication
    // In real app, this would redirect to HCMSIU SSO
    console.log("Login:", { email, password })
    // Redirect based on role (for demo, default to student)
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Illustration */}
      <div className="hidden flex-1 items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 lg:flex">
        <div className="max-w-md space-y-8 p-8 sm:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
              <span className="text-lg font-bold text-white">⊜</span>
            </div>
            <span className="text-xl font-bold">HCMSIU SSPS</span>
          </div>
          <div>
            <h1 className="text-balance text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
              Đăng nhập vào
            </h1>
            <p className="mt-2 text-xl font-semibold text-gray-700 sm:text-2xl">HCMSIU SSPS</p>
          </div>
          <div className="flex justify-center">
            <img src="/images/image.png" alt="Student illustration" className="max-w-sm" />
          </div>
          <div className="rounded-lg bg-white/50 p-4 text-sm text-gray-700">
            <p className="font-semibold">Xác thực qua HCMSIU SSO</p>
            <p className="mt-1">Sử dụng tài khoản sinh viên của bạn để đăng nhập</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
              <span className="text-lg font-bold text-white">⊜</span>
            </div>
            <span className="text-xl font-bold">HCMSIU SSPS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Đăng nhập</h2>
            <p className="mt-2 text-sm text-gray-600">Sử dụng tài khoản HCMSIU SSO</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email hoặc mã sinh viên</Label>
              <Input
                id="email"
                type="text"
                placeholder="Nhập email hoặc mã sinh viên"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-purple-50 border-purple-100 placeholder:text-purple-300"
                required
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

            <Button type="submit" className="h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700">
              Đăng nhập qua SSO
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

