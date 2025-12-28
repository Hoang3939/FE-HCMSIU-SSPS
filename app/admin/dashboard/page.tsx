"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Users, FileText, TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { getDashboardStats, getRecentActivities, type DashboardStats, type RecentActivity } from "@/lib/api/admin-api"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, activitiesData] = await Promise.all([
        getDashboardStats(),
        getRecentActivities(10),
      ])
      setStats(statsData)
      setActivities(activitiesData)
    } catch (error: any) {
      console.error("Error loading dashboard data:", error)
      
      // Provide more specific error messages
      if (error?.message?.includes('Cannot connect to backend server')) {
        toast.error("Không thể kết nối đến server. Vui lòng kiểm tra backend server có đang chạy không.")
      } else if (error?.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
      } else if (error?.response?.status === 403) {
        toast.error("Bạn không có quyền truy cập trang này.")
      } else {
        toast.error("Không thể tải dữ liệu dashboard: " + (error?.message || "Lỗi không xác định"))
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Bảng điều khiển</h1>
        <p className="text-gray-400">Tổng quan hệ thống in ấn sinh viên</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Tổng số máy in</CardTitle>
            <Printer className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalPrinters || 0}</div>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.activePrinters || 0} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Tổng số sinh viên</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.totalStudents.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Sinh viên đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">In hôm nay</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.printJobsToday.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Tổng {stats?.totalPrintJobs.toLocaleString() || 0} lần in
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Lỗi hôm nay</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats?.failedPrintJobs || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Cần xử lý</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Hoạt động gần đây</CardTitle>
              <CardDescription className="text-gray-400">
                Danh sách các hoạt động in ấn gần đây
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4 transition-colors hover:bg-[#1a1a1a]"
                >
                  <div className="flex items-center gap-4">
                    {activity.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {activity.type === "print" ? "In tài liệu" : "Lỗi in ấn"} - {activity.studentName || activity.studentId}
                      </div>
                      <div className="text-sm text-gray-400">
                        {activity.printerName || activity.printerId} • {activity.pages > 0 && `${activity.pages} trang • `}
                        {activity.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
