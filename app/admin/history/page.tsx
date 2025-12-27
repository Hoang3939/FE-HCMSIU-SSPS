"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, Search } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface PrintRecord {
  id: string
  studentId: string
  studentName: string
  fileName: string
  date: string
  time: string
  printer: string
  printerId: string
  pages: number
  pageSize: "A4" | "A3"
  status: "completed" | "failed"
  startTime: string
  endTime: string
}

export default function SPSOHistoryPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedPrinter, setSelectedPrinter] = useState("all")
  const [studentId, setStudentId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const printRecords: PrintRecord[] = [
    {
      id: "1",
      studentId: "SV001",
      studentName: "Nguyễn Văn A",
      fileName: "Assignment_Final.pdf",
      date: "2024-12-05",
      time: "10:30",
      printer: "Máy in H6-101",
      printerId: "h6-101",
      pages: 20,
      pageSize: "A4",
      status: "completed",
      startTime: "2024-12-05T10:30:00",
      endTime: "2024-12-05T10:35:00",
    },
    {
      id: "2",
      studentId: "SV002",
      studentName: "Trần Thị B",
      fileName: "Report_Lab4.docx",
      date: "2024-12-04",
      time: "14:15",
      printer: "Máy in Tòa Đức",
      printerId: "duc-101",
      pages: 15,
      pageSize: "A4",
      status: "completed",
      startTime: "2024-12-04T14:15:00",
      endTime: "2024-12-04T14:18:00",
    },
    {
      id: "3",
      studentId: "SV003",
      studentName: "Lê Văn C",
      fileName: "Presentation.pptx",
      date: "2024-12-03",
      time: "09:00",
      printer: "Máy in Lewis Hall",
      printerId: "lewis-102",
      pages: 10,
      pageSize: "A3",
      status: "completed",
      startTime: "2024-12-03T09:00:00",
      endTime: "2024-12-03T09:05:00",
    },
    {
      id: "4",
      studentId: "SV001",
      studentName: "Nguyễn Văn A",
      fileName: "Document.pdf",
      date: "2024-12-02",
      time: "16:45",
      printer: "Máy in H6-102",
      printerId: "h6-102",
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
    if (selectedPrinter !== "all" && record.printerId !== selectedPrinter) return false
    if (studentId && record.studentId !== studentId) return false
    if (
      searchQuery &&
      !record.fileName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

  const printers = Array.from(new Set(printRecords.map((r) => ({ id: r.printerId, name: r.printer }))))

  // Calculate summary statistics
  const summary = filteredRecords.reduce(
    (acc, record) => {
      if (record.status === "completed") {
        acc.totalJobs += 1
        if (record.pageSize === "A4") {
          acc.a4Pages += record.pages
          acc.totalPagesA4 += record.pages
        } else {
          acc.a3Pages += record.pages
          acc.totalPagesA4 += record.pages * 2 // A3 = 2 A4
        }
      }
      return acc
    },
    { totalJobs: 0, a4Pages: 0, a3Pages: 0, totalPagesA4: 0 }
  )

  return (
    <div className="p-6">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Lịch sử in ấn</h1>
          <p className="text-gray-600">Xem lịch sử in ấn của tất cả sinh viên</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Tên file, sinh viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-50 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Mã sinh viên</Label>
                  <Input
                    id="studentId"
                    placeholder="SV001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="bg-gray-50"
                  />
                </div>

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
                      <SelectItem key={printer.id} value={printer.id}>
                        {printer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
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
              <CardTitle className="text-sm font-medium">Tổng trang (A4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPagesA4}</div>
              <p className="text-xs text-muted-foreground mt-1">
                A4: {summary.a4Pages} | A3: {summary.a3Pages} (tương đương {summary.a3Pages * 2} A4)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trang A4</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.a4Pages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trang A3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.a3Pages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                = {summary.a3Pages * 2} trang A4
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Print History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách in ấn ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Mã SV</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tên SV</th>
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
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium sm:px-6">{record.studentId}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">{record.studentName}</td>
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
                  Hiển thị 1-{filteredRecords.length} trong tổng số {filteredRecords.length} bản ghi
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

