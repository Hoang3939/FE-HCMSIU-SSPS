"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, FileText } from "lucide-react"
import Link from "next/link"

function PrintConfigContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileCount = Number.parseInt(searchParams.get("files") || "1")

  const [copies, setCopies] = useState(1)
  const [doubleSided, setDoubleSided] = useState(false)
  const [paperSize, setPaperSize] = useState("A4")
  const [colorMode, setColorMode] = useState("color")
  const [printer, setPrinter] = useState("")
  const [pageRange, setPageRange] = useState("all")

  const printers = [
    { id: "h6-101", name: "Máy in H6-101", location: "Tòa H6, Phòng 101", status: "available" },
    { id: "h6-102", name: "Máy in H6-102", location: "Tòa H6, Phòng 102", status: "available" },
    { id: "lewis-102", name: "Máy in Lewis Hall", location: "Tòa Lewis Hall, Phòng 102", status: "available" },
    { id: "duc-101", name: "Máy in Tòa Đức", location: "Tòa Đức, Phòng 101", status: "busy" },
  ]

  const calculatePages = () => {
    const basePages = 20 // Assume 20 pages per file
    const totalPages = basePages * fileCount * copies
    // A3 pages count as 2 A4 pages
    const equivalentPages = paperSize === "A3" ? totalPages * 2 : totalPages
    return equivalentPages
  }

  const handlePrint = () => {
    // In real app, this would send print job to backend
    console.log("Print job:", {
      printer,
      copies,
      doubleSided,
      paperSize,
      colorMode,
      pageRange,
      pages: calculatePages(),
    })
    // Redirect to success page or back to dashboard
    router.push("/dashboard")
  }

  const estimatedPages = calculatePages()
  const balance = 50

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={balance} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Cấu hình in ấn</h1>
          <p className="text-gray-600">Thiết lập các tùy chọn in cho tài liệu của bạn</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* PDF Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">Tài liệu ({fileCount} tệp)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] rounded-lg bg-gray-100">
                <div className="flex h-full items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="mx-auto mb-2 h-12 w-12" />
                    <p>Xem trước PDF</p>
                    <p className="text-sm">{fileCount} tệp đã chọn</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                <Button variant="outline" size="sm">
                  Trước
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" className="bg-indigo-600">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <span className="text-sm text-gray-500">...</span>
                  <Button variant="outline" size="sm">
                    Sau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cấu hình in</CardTitle>
                  <span className="text-sm font-medium text-indigo-600">{estimatedPages} trang</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Printer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="printer">Máy in *</Label>
                  <Select value={printer} onValueChange={setPrinter}>
                    <SelectTrigger id="printer" className="bg-gray-50">
                      <SelectValue placeholder="Chọn máy in" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.map((p) => (
                        <SelectItem key={p.id} value={p.id} disabled={p.status === "busy"}>
                          {p.name} - {p.location}
                          {p.status === "busy" && " (Đang bận)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Paper Size */}
                <div className="space-y-2">
                  <Label htmlFor="paperSize">Khổ giấy</Label>
                  <Select value={paperSize} onValueChange={setPaperSize}>
                    <SelectTrigger id="paperSize" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A3">A3 (tương đương 2 trang A4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pages */}
                <div className="space-y-2">
                  <Label htmlFor="pages">Trang</Label>
                  <Select value={pageRange} onValueChange={setPageRange}>
                    <SelectTrigger id="pages" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">Màu</Label>
                  <Select value={colorMode} onValueChange={setColorMode}>
                    <SelectTrigger id="color" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Màu</SelectItem>
                      <SelectItem value="bw">Đen trắng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Copies */}
                <div className="space-y-2">
                  <Label htmlFor="copies">Số bản in</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="copies"
                      type="number"
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="text-center bg-gray-50"
                    />
                    <Button variant="outline" size="icon" onClick={() => setCopies(copies + 1)}>
                      +
                    </Button>
                  </div>
                </div>

                {/* Double Sided */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="double-sided">In hai mặt</Label>
                  <Switch id="double-sided" checked={doubleSided} onCheckedChange={setDoubleSided} />
                </div>

                {/* Advanced Settings */}
                <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50">
                  <span className="font-medium">Chế độ cài đặt khác</span>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Số trang dự kiến:</span>
                  <span className="font-semibold">{estimatedPages} trang</span>
                </div>
                {estimatedPages > balance && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    Số trang vượt quá số dư ({balance} trang). Vui lòng mua thêm trang.
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/upload" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Quay lại
                    </Button>
                  </Link>
                  <Button
                    onClick={handlePrint}
                    disabled={!printer || estimatedPages > balance}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {estimatedPages > balance ? "Không đủ trang" : "In ngay"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PrintConfigPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header userRole="student" balance={50} userName="Nguyễn Văn A" />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <PrintConfigContent />
    </Suspense>
  )
}

