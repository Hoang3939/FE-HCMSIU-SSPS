"use client"

import { useState } from "react"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Calendar, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly")
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12")

  // Mock data
  const monthlyData = [
    { month: "Tháng 1", prints: 4500, pages: 12500, students: 3200 },
    { month: "Tháng 2", prints: 5200, pages: 14500, students: 3500 },
    { month: "Tháng 3", prints: 4800, pages: 13200, students: 3300 },
    { month: "Tháng 4", prints: 6100, pages: 16800, students: 3800 },
    { month: "Tháng 5", prints: 5800, pages: 16200, students: 3700 },
    { month: "Tháng 6", prints: 5500, pages: 15200, students: 3600 },
    { month: "Tháng 7", prints: 4200, pages: 11800, students: 3000 },
    { month: "Tháng 8", prints: 3800, pages: 10500, students: 2800 },
    { month: "Tháng 9", prints: 4900, pages: 13500, students: 3400 },
    { month: "Tháng 10", prints: 5300, pages: 14800, students: 3600 },
    { month: "Tháng 11", prints: 5600, pages: 15500, students: 3700 },
    { month: "Tháng 12", prints: 6200, pages: 17200, students: 3900 },
  ]

  const yearlyData = [
    { year: "2022", prints: 55000, pages: 152000, students: 8500 },
    { year: "2023", prints: 62000, pages: 172000, students: 9200 },
    { year: "2024", prints: 65000, pages: 180000, students: 10000 },
  ]

  const printerUsageData = [
    { name: "H6-101", value: 35 },
    { name: "H6-102", value: 28 },
    { name: "Lewis-102", value: 20 },
    { name: "Tòa Đức", value: 12 },
    { name: "Khác", value: 5 },
  ]

  const currentData = reportType === "monthly" ? monthlyData : yearlyData
  const currentReport = reportType === "monthly"
    ? monthlyData.find((d) => d.month === selectedPeriod)
    : yearlyData.find((d) => d.year === selectedPeriod)

  const handleDownload = () => {
    // In real app, this would generate and download PDF/Excel report
    alert(`Đang tải báo cáo ${reportType === "monthly" ? "tháng" : "năm"} ${selectedPeriod}...`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="spso" userName="Admin SPSO" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Báo cáo hệ thống</h1>
            <p className="mt-2 text-gray-600">Xem và tải xuống báo cáo sử dụng hệ thống</p>
          </div>
          <div className="flex gap-2">
            <Select value={reportType} onValueChange={(value: "monthly" | "yearly") => setReportType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Theo tháng</SelectItem>
                <SelectItem value="yearly">Theo năm</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportType === "monthly"
                  ? monthlyData.map((d) => (
                      <SelectItem key={d.month} value={d.month}>
                        {d.month}
                      </SelectItem>
                    ))
                  : yearlyData.map((d) => (
                      <SelectItem key={d.year} value={d.year}>
                        {d.year}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="mr-2 h-4 w-4" />
              Tải xuống
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {currentReport && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tổng số lần in</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentReport.prints.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tổng số trang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentReport.pages.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Số sinh viên sử dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentReport.students.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Print Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Biểu đồ số lượng in
              </CardTitle>
              <CardDescription>
                {reportType === "monthly" ? "Theo tháng trong năm" : "Theo năm"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={reportType === "monthly" ? "month" : "year"} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="prints" fill="#4f46e5" name="Số lần in" />
                  <Bar dataKey="pages" fill="#10b981" name="Số trang" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Printer Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Phân bổ sử dụng máy in
              </CardTitle>
              <CardDescription>Tỷ lệ sử dụng các máy in</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={printerUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {printerUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Report List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Báo cáo đã lưu
            </CardTitle>
            <CardDescription>Danh sách các báo cáo đã được tạo tự động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Tháng", period: "Tháng 12/2024", date: "01/01/2025" },
                { type: "Tháng", period: "Tháng 11/2024", date: "01/12/2024" },
                { type: "Năm", period: "Năm 2024", date: "01/01/2025" },
                { type: "Tháng", period: "Tháng 10/2024", date: "01/11/2024" },
              ].map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">
                      Báo cáo {report.type} - {report.period}
                    </div>
                    <div className="text-sm text-gray-500">Tạo ngày: {report.date}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Tải xuống
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

