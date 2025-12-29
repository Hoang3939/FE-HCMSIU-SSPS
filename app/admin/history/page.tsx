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
    <div className="p-6 bg-[#121212] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Lịch sử in ấn</h1>
        <p className="text-gray-400">Xem lịch sử in ấn của tất cả sinh viên</p>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white mb-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar - Full Width Row */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-gray-300">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên file, sinh viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#4D47C3] focus-visible:shadow-[0_0_0_4px_rgba(77,71,195,0.1)] pl-10 transition-all duration-300"
                />
              </div>
            </div>

            {/* Filter Row - 4 Equal Columns */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-gray-300">Mã sinh viên</Label>
                <Input
                  id="studentId"
                  placeholder="SV001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="printer" className="text-gray-300">Máy in</Label>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger id="printer" className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-white focus:ring-[#4a4a4a]">
                    <SelectValue placeholder="Tất cả máy in" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                    <SelectItem value="all">Tất cả máy in</SelectItem>
                    {printers.map((printer) => (
                      <SelectItem key={printer.id} value={printer.id} className="hover:bg-[#3a3a3a]">
                        {printer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-gray-300">Từ ngày</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white focus-visible:ring-2 focus-visible:ring-[#4D47C3] date-picker-dark"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-gray-300">Đến ngày</Label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white focus-visible:ring-2 focus-visible:ring-[#4D47C3] date-picker-dark"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tổng số lần in</p>
                <p className="text-2xl font-bold text-white">{summary.totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tổng trang (A4)</p>
                <p className="text-2xl font-bold text-white">{summary.totalPagesA4}</p>
                <p className="text-xs text-gray-400 mt-1">
                  A4: {summary.a4Pages} | A3: {summary.a3Pages} (tương đương {summary.a3Pages * 2} A4)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Trang A4</p>
                <p className="text-2xl font-bold text-blue-400">{summary.a4Pages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Trang A3</p>
                <p className="text-2xl font-bold text-green-400">{summary.a3Pages}</p>
                <p className="text-xs text-gray-400 mt-1">
                  = {summary.a3Pages * 2} trang A4
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print History Table */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-xl">Danh sách in ấn ({filteredRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2a2a] text-white">
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
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr 
                      key={record.id} 
                      className="hover:bg-[#252525] transition-colors"
                      style={{
                        backgroundColor: index % 2 === 0 ? '#1E1E1E' : '#252525'
                      }}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-white sm:px-6">{record.studentId}</td>
                      <td className="px-4 py-4 text-sm text-gray-300 sm:px-6">{record.studentName}</td>
                      <td className="px-4 py-4 text-sm sm:px-6">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#A7A3FF]" />
                          <span className="text-gray-300">{record.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400 sm:px-6">
                        {format(new Date(record.date), "dd/MM/yyyy", { locale: vi })} {record.time}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400 sm:px-6">{record.printer}</td>
                      <td className="px-4 py-4 text-sm text-gray-300 sm:px-6">
                        {record.pages} trang {record.pageSize}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            record.status === "completed"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/30 text-red-400"
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
            <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-[#2a2a2a] px-4 py-4 sm:flex-row sm:px-6">
              <div className="text-sm text-gray-400">
                Hiển thị 1-{filteredRecords.length} trong tổng số {filteredRecords.length} bản ghi
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="border-[#3a3a3a] bg-transparent text-gray-400">
                  Trước
                </Button>
                <Button variant="default" size="sm" className="bg-[#4D47C3] hover:bg-[#3d37a3] text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" className="border-[#3a3a3a] bg-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white">
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

