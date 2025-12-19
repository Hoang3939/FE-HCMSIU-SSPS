"use client"

import { Header } from "@/components/shared/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Users, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SPSODashboard() {
  const stats = {
    totalPrinters: 50,
    activePrinters: 45,
    totalStudents: 10000,
    totalPrints: 50000,
    printsToday: 1250,
    failedPrints: 12,
  }

  const recentActivities = [
    { id: "1", type: "print", student: "SV001", printer: "H6-101", pages: 20, time: "10 phút trước", status: "success" },
    { id: "2", type: "print", student: "SV002", printer: "Lewis-102", pages: 15, time: "15 phút trước", status: "success" },
    { id: "3", type: "error", student: "SV003", printer: "H6-102", pages: 0, time: "20 phút trước", status: "failed" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="spso" userName="Admin SPSO" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Bảng điều khiển SPSO</h1>
          <p className="mt-2 text-gray-600">Tổng quan hệ thống in ấn sinh viên</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số máy in</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrinters}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePrinters} đang hoạt động
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số sinh viên</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sinh viên đã đăng ký</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In hôm nay</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.printsToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tổng {stats.totalPrints.toLocaleString()} lần in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lỗi hôm nay</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedPrints}</div>
              <p className="text-xs text-muted-foreground">Cần xử lý</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/spso/history">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Lịch sử in
                </CardTitle>
                <CardDescription>Xem tất cả lịch sử in ấn</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/spso/printers">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-indigo-600" />
                  Quản lý máy in
                </CardTitle>
                <CardDescription>Thêm/sửa/xóa máy in</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/spso/config">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Cấu hình hệ thống
                </CardTitle>
                <CardDescription>Thiết lập hệ thống</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/spso/reports">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Báo cáo
                </CardTitle>
                <CardDescription>Xem báo cáo tháng/năm</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Danh sách các hoạt động in ấn gần đây</CardDescription>
              </div>
              <Link href="/spso/history">
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {activity.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {activity.type === "print" ? "In tài liệu" : "Lỗi in ấn"} - {activity.student}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.printer} • {activity.pages > 0 && `${activity.pages} trang • `}
                        {activity.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

