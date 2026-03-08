"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, Settings, RefreshCw, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { getSystemConfigs, updateSystemConfigs, resetStudentPages, type SystemConfig } from "@/lib/api/admin-api"
import { useAuthStore } from "@/lib/stores/auth-store"
import { authAPI } from "@/lib/api/auth-api"

export default function SystemConfigPage() {
  const router = useRouter()
  const { user, accessToken, setAccessToken } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Config state
  const [defaultPages, setDefaultPages] = useState(100)
  const [semester1Date, setSemester1Date] = useState("") // Học kỳ 1
  const [semester2Date, setSemester2Date] = useState("") // Học kỳ 2
  const [semester3Date, setSemester3Date] = useState("") // Học kỳ phụ
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([])
  const [maxFileSize, setMaxFileSize] = useState(20)
  const [pricePerPage, setPricePerPage] = useState(500)

  const fileTypeOptions = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"]

  // Convert file type format: "pdf" <-> ".pdf"
  const toDisplayFormat = (type: string) => type.startsWith(".") ? type : `.${type}`
  const toApiFormat = (type: string) => type.startsWith(".") ? type.substring(1) : type

  /**
   * Validate semester dates order: semester1 <= semester2 <= semester3
   */
  const validateSemesterDates = (): string | null => {
    if (!semester1Date || !semester2Date || !semester3Date) {
      return null // Allow empty dates during editing
    }

    const date1 = new Date(semester1Date)
    const date2 = new Date(semester2Date)
    const date3 = new Date(semester3Date)

    if (isNaN(date1.getTime()) || isNaN(date2.getTime()) || isNaN(date3.getTime())) {
      return 'Vui lòng chọn ngày hợp lệ cho tất cả các học kỳ'
    }

    if (date1 > date2) {
      return 'Học kỳ 1 không được lớn hơn Học kỳ 2'
    }

    if (date2 > date3) {
      return 'Học kỳ 2 không được lớn hơn Học kỳ phụ'
    }

    return null
  }

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[ConfigPage] Loading configs from API...')
      const configs = await getSystemConfigs()
      console.log('[ConfigPage] Configs loaded:', configs)
      
      setDefaultPages(configs.default_page_balance)
      setMaxFileSize(configs.max_file_size_mb)
      setPricePerPage(configs.price_per_page)
      
      // Load semester dates
      if (configs.semester_dates) {
        if (configs.semester_dates.semester1) {
          const date1 = new Date(configs.semester_dates.semester1)
          setSemester1Date(date1.toISOString().split('T')[0])
        }
        if (configs.semester_dates.semester2) {
          const date2 = new Date(configs.semester_dates.semester2)
          setSemester2Date(date2.toISOString().split('T')[0])
        }
        if (configs.semester_dates.semester3) {
          const date3 = new Date(configs.semester_dates.semester3)
          setSemester3Date(date3.toISOString().split('T')[0])
        }
      }
      
      // Convert file types from API format ("pdf") to display format (".pdf")
      setAllowedFileTypes(configs.allowed_file_types.map(toDisplayFormat))
    } catch (err: any) {
      console.error('[ConfigPage] Error loading configs:', err)
      setError(err.message || 'Không thể tải cấu hình hệ thống')
      toast.error(err.message || 'Không thể tải cấu hình hệ thống')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      // Đợi Zustand store hydrate từ localStorage (có thể mất thời gian)
      // Thử nhiều lần để đảm bảo store đã hydrate
      let attempts = 0
      let currentUser = useAuthStore.getState().user
      
      while (!currentUser && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 50))
        currentUser = useAuthStore.getState().user
        attempts++
        console.log(`[ConfigPage] Waiting for store hydration, attempt ${attempts}...`)
      }

      if (!isMounted) return

      setCheckingAuth(true)

      // Lấy lại state từ store để đảm bảo có giá trị mới nhất
      const finalUser = useAuthStore.getState().user

      console.log('[ConfigPage] Auth check:', {
        hasUser: !!finalUser,
        userRole: finalUser?.role,
        userID: finalUser?.userID,
        attempts
      })

      // Nếu không có user sau khi đợi, redirect
      if (!finalUser) {
        console.log('[ConfigPage] No user found after hydration, redirecting to login')
        if (isMounted) {
          toast.error('Vui lòng đăng nhập để truy cập trang này')
          router.push('/login')
        }
        return
      }

      // Check role
      if (finalUser.role !== 'ADMIN' && finalUser.role !== 'SPSO') {
        console.log('[ConfigPage] Invalid role, redirecting to dashboard')
        if (isMounted) {
          toast.error('Bạn không có quyền truy cập trang này')
          router.push('/dashboard')
        }
        return
      }

      // Nếu có user và role đúng, load configs ngay
      // Không cần check accessToken - interceptor sẽ tự động xử lý refresh nếu cần
      // Chỉ redirect về login nếu thực sự là lỗi auth (401), không phải lỗi server (500)
      console.log('[ConfigPage] User authenticated, loading configs...')
      
      if (isMounted) {
        setCheckingAuth(false)
        
        // Load configs - interceptor sẽ tự động refresh token nếu cần
        // Nếu refresh fail với lỗi auth (401), interceptor sẽ redirect
        // Nếu refresh fail với lỗi server (500), không redirect, chỉ hiển thị error
        loadConfigs().catch((err: any) => {
          console.error('[ConfigPage] Error loading configs:', err)
          // Chỉ set error nếu không phải 401 (401 đã được interceptor xử lý)
          // Không redirect ở đây - để interceptor xử lý
          if (err.response?.status !== 401 && err.code !== 'ERR_NETWORK') {
            setError(err.message || 'Không thể tải cấu hình')
            toast.error(err.message || 'Không thể tải cấu hình')
          }
        })
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, loadConfigs])

  const toggleFileType = (type: string) => {
    const displayType = toDisplayFormat(type)
    if (allowedFileTypes.includes(displayType)) {
      setAllowedFileTypes(allowedFileTypes.filter((t) => t !== displayType))
    } else {
      setAllowedFileTypes([...allowedFileTypes, displayType])
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Convert file types from display format (".pdf") to API format ("pdf")
      const apiFileTypes = allowedFileTypes.map(toApiFormat)

      // Validate semester dates
      const validationError = validateSemesterDates()
      if (validationError) {
        throw new Error(validationError)
      }

      // Convert semester dates from YYYY-MM-DD to ISO8601
      const semesterDates: {
        semester1?: string
        semester2?: string
        semester3?: string
      } = {}

      if (semester1Date) {
        const date1 = new Date(semester1Date)
        if (!isNaN(date1.getTime())) {
          semesterDates.semester1 = date1.toISOString()
        }
      }

      if (semester2Date) {
        const date2 = new Date(semester2Date)
        if (!isNaN(date2.getTime())) {
          semesterDates.semester2 = date2.toISOString()
        }
      }

      if (semester3Date) {
        const date3 = new Date(semester3Date)
        if (!isNaN(date3.getTime())) {
          semesterDates.semester3 = date3.toISOString()
        }
      }

      const updates = {
        default_page_balance: defaultPages,
        allowed_file_types: apiFileTypes,
        max_file_size_mb: maxFileSize,
        price_per_page: pricePerPage,
        semester_dates: semesterDates,
      }

      console.log('[ConfigPage] Saving configs:', updates)
      await updateSystemConfigs(updates)
      toast.success('Đã lưu cấu hình thành công!')
    } catch (err: any) {
      console.error('[ConfigPage] Error saving configs:', err)
      const errorMessage = err.message || 'Không thể lưu cấu hình'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleResetPages = async () => {
    if (!confirm('Bạn có chắc chắn muốn reset số trang về mặc định cho tất cả sinh viên?')) {
      return
    }

    try {
      setResetting(true)
      setError(null)
      console.log('[ConfigPage] Resetting student pages...')
      const result = await resetStudentPages()
      toast.success(`Đã reset số trang cho ${result.resetCount} sinh viên thành công!`)
    } catch (err: any) {
      console.error('[ConfigPage] Error resetting pages:', err)
      const errorMessage = err.message || 'Không thể reset số trang'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setResetting(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#A7A3FF]" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#A7A3FF]" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Cấu hình hệ thống</h1>
          <p className="text-gray-400">Thiết lập các thông số hệ thống</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-900/30 border border-red-900/50 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Default Pages Configuration */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-[#A7A3FF]" />
              Số trang mặc định mỗi học kỳ
            </CardTitle>
            <CardDescription className="text-gray-400">
              Số trang A4 mặc định mà hệ thống sẽ cấp cho mỗi sinh viên vào đầu học kỳ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPages" className="text-gray-300">Số trang mặc định</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="defaultPages"
                    type="number"
                    value={defaultPages}
                    onChange={(e) => setDefaultPages(Number.parseInt(e.target.value) || 0)}
                    className="w-28 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                    min="0"
                    max="1000"
                  />
                  <span className="text-sm text-gray-400">trang A4</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester Dates Configuration */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-[#A7A3FF]" />
              Thời gian cấp phát trang in tự động
            </CardTitle>
            <CardDescription className="text-gray-400">
              Đây là thời gian cấp phát trang in tự động cho sinh viên vào mỗi kỳ học.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Học kỳ 1 */}
              <div className="space-y-2">
                <Label htmlFor="semester1Date" className="text-gray-300">Học kỳ 1 (Học kỳ chính)</Label>
                <Input
                  id="semester1Date"
                  type="date"
                  value={semester1Date}
                  onChange={(e) => {
                    setSemester1Date(e.target.value)
                    // Auto-validate after change
                    setTimeout(() => {
                      const error = validateSemesterDates()
                      if (error) {
                        setError(error)
                      } else {
                        setError(null)
                      }
                    }, 100)
                  }}
                  className="date-picker-dark bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                />
                {semester1Date && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(semester1Date), "dd/MM/yyyy", { locale: vi })}
                  </p>
                )}
              </div>

              {/* Học kỳ 2 */}
              <div className="space-y-2">
                <Label htmlFor="semester2Date" className="text-gray-300">Học kỳ 2 (Học kỳ chính)</Label>
                <Input
                  id="semester2Date"
                  type="date"
                  value={semester2Date}
                  onChange={(e) => {
                    setSemester2Date(e.target.value)
                    // Auto-validate after change
                    setTimeout(() => {
                      const error = validateSemesterDates()
                      if (error) {
                        setError(error)
                      } else {
                        setError(null)
                      }
                    }, 100)
                  }}
                  className="date-picker-dark bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                />
                {semester2Date && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(semester2Date), "dd/MM/yyyy", { locale: vi })}
                  </p>
                )}
              </div>

              {/* Học kỳ phụ */}
              <div className="space-y-2">
                <Label htmlFor="semester3Date" className="text-gray-300">Học kỳ phụ</Label>
                <Input
                  id="semester3Date"
                  type="date"
                  value={semester3Date}
                  onChange={(e) => {
                    setSemester3Date(e.target.value)
                    // Auto-validate after change
                    setTimeout(() => {
                      const error = validateSemesterDates()
                      if (error) {
                        setError(error)
                      } else {
                        setError(null)
                      }
                    }, 100)
                  }}
                  className="date-picker-dark bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                />
                {semester3Date && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(semester3Date), "dd/MM/yyyy", { locale: vi })}
                  </p>
                )}
              </div>

              {/* Validation message */}
              {semester1Date && semester2Date && semester3Date && validateSemesterDates() && (
                <div className="rounded-lg bg-amber-900/30 border border-amber-900/50 p-3">
                  <p className="text-sm text-amber-400">
                    ⚠️ {validateSemesterDates()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Max File Size and Price Per Page - Grid 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Max File Size Configuration */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-[#A7A3FF]" />
                Kích thước file tối đa
              </CardTitle>
              <CardDescription className="text-gray-400">
                Giới hạn dung lượng file mà sinh viên được phép upload (MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize" className="text-gray-300">Kích thước tối đa (MB)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(Number.parseFloat(e.target.value) || 0)}
                    className="w-28 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                    min="1"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-400">MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Per Page Configuration */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-[#A7A3FF]" />
                Giá mỗi trang in
              </CardTitle>
              <CardDescription className="text-gray-400">
                Số tiền (VNĐ) hoặc điểm quy đổi cho mỗi trang in bổ sung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="pricePerPage" className="text-gray-300">Giá mỗi trang (VNĐ)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="pricePerPage"
                    type="number"
                    value={pricePerPage}
                    onChange={(e) => setPricePerPage(Number.parseInt(e.target.value) || 0)}
                    className="w-28 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                    min="0"
                  />
                  <span className="text-sm text-gray-400">VNĐ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Allowed File Types */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5 text-[#A7A3FF]" />
              Loại tệp được phép
            </CardTitle>
            <CardDescription className="text-gray-400">
              Chọn các loại tệp mà sinh viên được phép upload và in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fileTypeOptions.map((type) => {
                const displayType = toDisplayFormat(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleFileType(type)}
                    className={`flex items-center justify-center rounded-lg border-2 p-3 transition-colors ${
                      allowedFileTypes.includes(displayType)
                        ? "border-[#4D47C3] bg-[#4D47C3]/20 text-[#A7A3FF] hover:bg-[#4D47C3]/30"
                        : "border-[#3a3a3a] bg-[#2a2a2a] text-gray-400 hover:border-[#4a4a4a] hover:text-gray-300"
                    }`}
                  >
                    <span className="font-medium">{displayType.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Đã chọn: {allowedFileTypes.length} loại tệp</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleResetPages}
            disabled={resetting}
            className="flex items-center gap-2 border-[#3a3a3a] bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] hover:text-white"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reset số trang
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4D47C3] hover:bg-[#3d37a3] text-white flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu cấu hình"
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
