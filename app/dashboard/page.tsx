"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Printer, History, CreditCard, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getUserBalance } from "@/lib/api"

export default function StudentDashboard() {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balanceData = await getUserBalance()
        setBalance(balanceData.balancePages)
      } catch (error) {
        console.error('Error loading balance:', error)
      }
    }
    loadBalance()
  }, [])
  const recentPrints = [
    { id: "1", fileName: "Báo cáo đồ án.pdf", date: "Hôm nay", pages: 20 },
    { id: "2", fileName: "Bài tập lớn.docx", date: "Hôm qua", pages: 15 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={balance} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Chào mừng trở lại!</h1>
          <p className="mt-2 text-gray-600">Quản lý và in tài liệu của bạn một cách dễ dàng</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số trang còn lại</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance}</div>
              <p className="text-xs text-muted-foreground">Trang A4</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số lần in</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Trong tháng này</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trang đã in</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Trong tháng này</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máy in gần nhất</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">H6-101</div>
              <p className="text-xs text-muted-foreground">Tòa H6</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/upload">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Tải lên & In
                </CardTitle>
                <CardDescription>Upload và in tài liệu mới</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600" />
                  Lịch sử in
                </CardTitle>
                <CardDescription>Xem lịch sử in ấn</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/buy-pages">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Mua trang
                </CardTitle>
                <CardDescription>Nạp thêm trang in</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/printers">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-indigo-600" />
                  Tìm máy in
                </CardTitle>
                <CardDescription>Xem vị trí máy in</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Prints */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>In gần đây</CardTitle>
                <CardDescription>Danh sách các tài liệu đã in gần đây</CardDescription>
              </div>
              <Link href="/history">
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrints.map((print) => (
                <div
                  key={print.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium">{print.fileName}</div>
                      <div className="text-sm text-gray-500">{print.pages} trang • {print.date}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

