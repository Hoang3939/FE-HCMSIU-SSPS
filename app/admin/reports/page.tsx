"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Calendar, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly")
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12")

  // Mock data with page size breakdown
  const monthlyData = [
    { month: "Tháng 1", prints: 4500, pages: 12500, pagesA4: 11000, pagesA3: 750, students: 3200 },
    { month: "Tháng 2", prints: 5200, pages: 14500, pagesA4: 12800, pagesA3: 850, students: 3500 },
    { month: "Tháng 3", prints: 4800, pages: 13200, pagesA4: 11600, pagesA3: 800, students: 3300 },
    { month: "Tháng 4", prints: 6100, pages: 16800, pagesA4: 14800, pagesA3: 1000, students: 3800 },
    { month: "Tháng 5", prints: 5800, pages: 16200, pagesA4: 14200, pagesA3: 1000, students: 3700 },
    { month: "Tháng 6", prints: 5500, pages: 15200, pagesA4: 13400, pagesA3: 900, students: 3600 },
    { month: "Tháng 7", prints: 4200, pages: 11800, pagesA4: 10400, pagesA3: 700, students: 3000 },
    { month: "Tháng 8", prints: 3800, pages: 10500, pagesA4: 9300, pagesA3: 600, students: 2800 },
    { month: "Tháng 9", prints: 4900, pages: 13500, pagesA4: 11900, pagesA3: 800, students: 3400 },
    { month: "Tháng 10", prints: 5300, pages: 14800, pagesA4: 13000, pagesA3: 900, students: 3600 },
    { month: "Tháng 11", prints: 5600, pages: 15500, pagesA4: 13600, pagesA3: 950, students: 3700 },
    { month: "Tháng 12", prints: 6200, pages: 17200, pagesA4: 15100, pagesA3: 1050, students: 3900 },
  ]

  const yearlyData = [
    { year: "2022", prints: 55000, pages: 152000, pagesA4: 134000, pagesA3: 9000, students: 8500 },
    { year: "2023", prints: 62000, pages: 172000, pagesA4: 151000, pagesA3: 10500, students: 9200 },
    { year: "2024", prints: 65000, pages: 180000, pagesA4: 158000, pagesA3: 11000, students: 10000 },
  ]

  const printerUsageData = [
    { name: "H6-101", value: 35, color: COLORS[0] },
    { name: "H6-102", value: 28, color: COLORS[1] },
    { name: "Lewis-102", value: 20, color: COLORS[2] },
    { name: "Tòa Đức", value: 12, color: COLORS[3] },
    { name: "Khác", value: 5, color: COLORS[4] },
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
    <div className="p-6 bg-[#121212] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Báo cáo hệ thống</h1>
            <p className="text-gray-400">Xem và tải xuống báo cáo sử dụng hệ thống</p>
          </div>
          <div className="flex gap-2">
            <Select value={reportType} onValueChange={(value: "monthly" | "yearly") => setReportType(value)}>
              <SelectTrigger className="w-32 bg-[#2a2a2a] border-[#3a3a3a] text-white focus:ring-[#4a4a4a] [&>span]:text-white [&_svg]:text-gray-300">
                <SelectValue placeholder="Theo tháng" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                <SelectItem value="monthly" className="text-white hover:bg-[#3a3a3a] focus:text-white">Theo tháng</SelectItem>
                <SelectItem value="yearly" className="text-white hover:bg-[#3a3a3a] focus:text-white">Theo năm</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40 bg-[#2a2a2a] border-[#3a3a3a] text-white focus:ring-[#4a4a4a] [&>span]:text-white [&_svg]:text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                {reportType === "monthly"
                  ? monthlyData.map((d) => (
                      <SelectItem key={d.month} value={d.month} className="text-white hover:bg-[#3a3a3a] focus:text-white">
                        {d.month}
                      </SelectItem>
                    ))
                  : yearlyData.map((d) => (
                      <SelectItem key={d.year} value={d.year} className="text-white hover:bg-[#3a3a3a] focus:text-white">
                        {d.year}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} className="bg-[#4D47C3] hover:bg-[#3d37a3] text-white">
              <Download className="mr-2 h-4 w-4" />
              Tải xuống
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {currentReport && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tổng số lần in</p>
                <p className="text-2xl font-bold text-white">{currentReport.prints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tổng số trang (A4)</p>
                <p className="text-2xl font-bold text-white">{currentReport.pages.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">
                  A4: {currentReport.pagesA4?.toLocaleString() || 0} | A3: {currentReport.pagesA3?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Trang A4</p>
                <p className="text-2xl font-bold text-blue-400">
                  {currentReport.pagesA4?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Trang A3</p>
                <p className="text-2xl font-bold text-green-400">
                  {currentReport.pagesA3?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  (Tương đương {(currentReport.pagesA3 || 0) * 2} trang A4)
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Số sinh viên</p>
                <p className="text-2xl font-bold text-white">{currentReport.students.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Print Volume Chart */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-[#A7A3FF]" />
              Biểu đồ số lượng in
            </CardTitle>
            <CardDescription className="text-gray-400">
              {reportType === "monthly" ? "Theo tháng trong năm" : "Theo năm"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" opacity={0.3} />
                <XAxis 
                  dataKey={reportType === "monthly" ? "month" : "year"} 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2a2a2a', 
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="prints" fill="#4D47C3" name="Số lần in" />
                <Bar dataKey="pagesA4" fill="#3b82f6" name="Trang A4" />
                <Bar dataKey="pagesA3" fill="#10b981" name="Trang A3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Printer Usage Chart */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-[#A7A3FF]" />
              Phân bổ sử dụng máy in
            </CardTitle>
            <CardDescription className="text-gray-400">Tỷ lệ sử dụng các máy in</CardDescription>
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
                  innerRadius={0}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {printerUsageData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload as { name: string; value: number; color: string }
                      return (
                        <div
                          style={{
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '8px',
                            padding: '8px 12px',
                          }}
                        >
                          <p style={{ color: data.color, margin: 0, fontWeight: 500 }}>
                            {data.name}: {data.value}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Report List */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-[#A7A3FF]" />
            Báo cáo đã lưu
          </CardTitle>
          <CardDescription className="text-gray-400">Danh sách các báo cáo đã được tạo tự động</CardDescription>
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
                className={`flex items-center justify-between rounded-lg border border-[#2a2a2a] p-4 transition-colors hover:bg-[#252525] ${
                  index % 2 === 0 ? 'bg-[#1E1E1E]' : 'bg-[#252525]'
                }`}
              >
                <div>
                  <div className="font-medium text-white">
                    Báo cáo {report.type} - {report.period}
                  </div>
                  <div className="text-sm text-gray-400">Tạo ngày: {report.date}</div>
                </div>
                <Button variant="outline" size="sm" className="border-[#3a3a3a] bg-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Tải xuống
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

