"use client"

import { useState } from "react"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, Settings } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export default function SystemConfigPage() {
  const [defaultPages, setDefaultPages] = useState(100)
  const [startDate, setStartDate] = useState("2024-09-01")
  const [endDate, setEndDate] = useState("2024-12-31")
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([".pdf", ".doc", ".docx", ".ppt", ".pptx"])

  const fileTypeOptions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt"]

  const toggleFileType = (type: string) => {
    if (allowedFileTypes.includes(type)) {
      setAllowedFileTypes(allowedFileTypes.filter((t) => t !== type))
    } else {
      setAllowedFileTypes([...allowedFileTypes, type])
    }
  }

  const handleSave = () => {
    // In real app, this would save to backend
    console.log("Saving config:", {
      defaultPages,
      startDate,
      endDate,
      allowedFileTypes,
    })
    alert("Đã lưu cấu hình thành công!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="spso" userName="Admin SPSO" />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Cấu hình hệ thống</h1>
          <p className="mt-2 text-gray-600">Thiết lập các thông số hệ thống</p>
        </div>

        {/* Default Pages Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Số trang mặc định mỗi học kỳ
            </CardTitle>
            <CardDescription>
              Số trang A4 mặc định mà hệ thống sẽ cấp cho mỗi sinh viên vào đầu học kỳ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPages">Số trang mặc định</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="defaultPages"
                    type="number"
                    value={defaultPages}
                    onChange={(e) => setDefaultPages(Number.parseInt(e.target.value) || 0)}
                    className="w-32"
                    min="0"
                  />
                  <span className="text-sm text-gray-600">trang A4</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester Dates Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Ngày cấp trang mặc định
            </CardTitle>
            <CardDescription>
              Khoảng thời gian hệ thống sẽ tự động cấp số trang mặc định cho tất cả sinh viên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {startDate && format(new Date(startDate), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {endDate && format(new Date(endDate), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allowed File Types */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              Loại tệp được phép
            </CardTitle>
            <CardDescription>
              Chọn các loại tệp mà sinh viên được phép upload và in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fileTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleFileType(type)}
                  className={`flex items-center justify-center rounded-lg border-2 p-3 transition-colors ${
                    allowedFileTypes.includes(type)
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">{type.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Đã chọn: {allowedFileTypes.length} loại tệp</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Hủy</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            Lưu cấu hình
          </Button>
        </div>
      </main>
    </div>
  )
}

