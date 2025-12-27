"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, FileText, Calendar, Eye } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface Student {
  id: string
  name: string
  email: string
  balance: number
  totalPrints: number
  totalPages: number
  lastPrintDate: string | null
  status: "active" | "inactive"
}

interface StudentPrintHistory {
  id: string
  fileName: string
  date: string
  time: string
  printer: string
  pages: number
  pageSize: "A4" | "A3"
  status: "completed" | "failed"
}

export default function StudentsManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)

  const students: Student[] = [
    {
      id: "SV001",
      name: "Nguyễn Văn A",
      email: "sv001@student.hcmsiu.edu.vn",
      balance: 50,
      totalPrints: 24,
      totalPages: 156,
      lastPrintDate: "2024-12-05",
      status: "active",
    },
    {
      id: "SV002",
      name: "Trần Thị B",
      email: "sv002@student.hcmsiu.edu.vn",
      balance: 120,
      totalPrints: 18,
      totalPages: 98,
      lastPrintDate: "2024-12-04",
      status: "active",
    },
    {
      id: "SV003",
      name: "Lê Văn C",
      email: "sv003@student.hcmsiu.edu.vn",
      balance: 0,
      totalPrints: 5,
      totalPages: 32,
      lastPrintDate: "2024-11-28",
      status: "active",
    },
    {
      id: "SV004",
      name: "Phạm Thị D",
      email: "sv004@student.hcmsiu.edu.vn",
      balance: 200,
      totalPrints: 45,
      totalPages: 320,
      lastPrintDate: "2024-12-05",
      status: "active",
    },
  ]

  const studentHistory: Record<string, StudentPrintHistory[]> = {
    SV001: [
      {
        id: "1",
        fileName: "Assignment_Final.pdf",
        date: "2024-12-05",
        time: "10:30",
        printer: "Máy in H6-101",
        pages: 20,
        pageSize: "A4",
        status: "completed",
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
      },
    ],
  }

  const filteredStudents = students.filter(
    (student) =>
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewHistory = (student: Student) => {
    setSelectedStudent(student)
    setIsHistoryDialogOpen(true)
  }

  return (
    <div className="p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Quản lý sinh viên</h1>
            <p className="mt-2 text-gray-600">Xem thông tin và lịch sử in ấn của sinh viên</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã SV, tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách sinh viên ({filteredStudents.length})</CardTitle>
            <CardDescription>Tổng số sinh viên đã đăng ký sử dụng hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Mã SV</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tên</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Số dư</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tổng lần in</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tổng trang</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">In gần nhất</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Không tìm thấy sinh viên
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium sm:px-6">{student.id}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">{student.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">{student.email}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge
                            className={
                              student.balance > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {student.balance} trang
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm sm:px-6">{student.totalPrints}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">{student.totalPages}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                          {student.lastPrintDate
                            ? format(new Date(student.lastPrintDate), "dd/MM/yyyy", { locale: vi })
                            : "Chưa có"}
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(student)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem lịch sử
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-6">
                <div className="text-sm text-gray-500">
                  Hiển thị 1-{filteredStudents.length} trong tổng số {filteredStudents.length} sinh viên
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

        {/* Student History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lịch sử in ấn - {selectedStudent?.name} ({selectedStudent?.id})</DialogTitle>
              <DialogDescription>
                Xem chi tiết lịch sử in ấn của sinh viên này
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStudent.balance} trang</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tổng lần in</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStudent.totalPrints}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tổng trang đã in</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStudent.totalPages}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-4 font-semibold">Lịch sử in ấn</h3>
                  <div className="space-y-2">
                    {studentHistory[selectedStudent.id]?.length > 0 ? (
                      studentHistory[selectedStudent.id].map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{record.fileName}</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(record.date), "dd/MM/yyyy", { locale: vi })} {record.time} • {record.printer} • {record.pages} trang {record.pageSize}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={
                              record.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {record.status === "completed" ? "Hoàn thành" : "Thất bại"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-gray-500">Chưa có lịch sử in ấn</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href={`/admin/history?studentId=${selectedStudent.id}`}>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Xem chi tiết đầy đủ
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

