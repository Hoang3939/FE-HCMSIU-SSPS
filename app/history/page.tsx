"use client"

import { useState, useEffect } from "react"
import { getUserBalance } from "@/lib/api"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface PrintRecord {
  id: string
  fileName: string
  date: string
  time: string
  printer: string
  pages: number
  pageSize: "A4" | "A3"
  status: "completed" | "failed"
  startTime: string
  endTime: string
}

export default function PrintHistoryPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedPrinter, setSelectedPrinter] = useState("all")
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

  const printRecords: PrintRecord[] = [
    {
      id: "1",
      fileName: "Assignment_Final.pdf",
      date: "2024-12-05",
      time: "10:30",
      printer: "Máy in H6-101",
      pages: 20,
      pageSize: "A4",
      status: "completed",
      startTime: "2024-12-05T10:30:00",
      endTime: "2024-12-05T10:35:00",
    },
    {
      id: "2",
      fileName: "Report_Lab4.docx",
      date: "2024-12-04",
      time: "14:15",
      printer: "Máy in Tòa Đức",
      pages: 15,
      pageSize: "A4",
      status: "completed",
      startTime: "2024-12-04T14:15:00",
      endTime: "2024-12-04T14:18:00",
    },
    {
      id: "3",
      fileName: "Presentation.pptx",
      date: "2024-12-03",
      time: "09:00",
      printer: "Máy in Lewis Hall",
      pages: 10,
      pageSize: "A3",
      status: "completed",
      startTime: "2024-12-03T09:00:00",
      endTime: "2024-12-03T09:05:00",
    },
    {
      id: "4",
      fileName: "Document.pdf",
      date: "2024-12-02",
      time: "16:45",
      printer: "Máy in H6-102",
      pages: 30,
      pageSize: "A4",
      status: "failed",
      startTime: "2024-12-02T16:45:00",
      endTime: "2024-12-02T16:45:00",
    },
  ]

  const filteredRecords = printRecords.filter((record) => {
    if (startDate && record.date < startDate) return false
    if (endDate && record.date > endDate) return false
    if (selectedPrinter !== "all" && record.printer !== selectedPrinter) return false
    return true
  })

  const summary = filteredRecords.reduce(
    (acc, record) => {
      if (record.status === "completed") {
        acc.totalPages += record.pageSize === "A3" ? record.pages * 2 : record.pages
        acc.a4Pages += record.pageSize === "A4" ? record.pages : 0
        acc.a3Pages += record.pageSize === "A3" ? record.pages : 0
        acc.totalJobs += 1
      }
      return acc
    },
    { totalPages: 0, a4Pages: 0, a3Pages: 0, totalJobs: 0 }
  )

  const printers = Array.from(new Set(printRecords.map((r) => r.printer)))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={balance} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Lịch sử in ấn</h1>
          <p className="text-gray-600">Xem lại lịch sử in ấn các tài liệu</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Từ ngày</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-gray-50"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Đến ngày</Label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gray-50"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="printer">Máy in</Label>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger id="printer" className="bg-gray-50">
                    <SelectValue placeholder="Tất cả máy in" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả máy in</SelectItem>
                    {printers.map((printer) => (
                      <SelectItem key={printer} value={printer}>
                        {printer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tổng số lần in</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tổng số trang (A4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trang A4</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.a4Pages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trang A3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.a3Pages}</div>
            </CardContent>
          </Card>
        </div>

        {/* Print History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách in ấn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tên tài liệu</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Thời gian</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Máy in</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Số trang</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            {record.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                          {format(new Date(record.date), "dd/MM/yyyy", { locale: vi })} {record.time}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">{record.printer}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          {record.pages} trang {record.pageSize}
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              record.status === "completed"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {record.status === "completed" ? "Hoàn thành" : "Thất bại"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredRecords.length > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-6">
                <div className="text-sm text-gray-500">
                  Hiển thị 1-{filteredRecords.length} trong tổng số {filteredRecords.length} lịch sử
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Trước
                  </Button>
                  <Button variant="default" size="sm" className="bg-indigo-600">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

