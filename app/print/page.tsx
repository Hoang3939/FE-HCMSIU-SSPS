"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { createPrintJob, getAvailablePrinters, getUserBalance, getCurrentUser, login } from "@/lib/api"
import { toast } from "sonner"

interface UploadedDocument {
  id: string
  fileName: string
  pageCount: number
  fileSize: number
}

function PrintConfigContent() {
  const router = useRouter()
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string>("")
  const [printers, setPrinters] = useState<Array<{ id: string; name: string; location: string; isActive: boolean }>>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [copies, setCopies] = useState(1)
  const [doubleSided, setDoubleSided] = useState(false)
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4")
  const [orientation, setOrientation] = useState<"PORTRAIT" | "LANDSCAPE">("PORTRAIT")
  const [printerId, setPrinterId] = useState("")
  const [pageRange, setPageRange] = useState("all")
  const [customPageRange, setCustomPageRange] = useState("")
  
  // Advanced settings (like Google Print)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [margins, setMargins] = useState<"default" | "minimum" | "none">("default")
  const [scale, setScale] = useState<"fit" | "100" | "custom">("fit")
  const [customScale, setCustomScale] = useState(100)
  const [backgroundGraphics, setBackgroundGraphics] = useState(false)
  const [colorMode, setColorMode] = useState<"color" | "grayscale">("color")
  const [quality, setQuality] = useState<"draft" | "normal" | "high">("normal")
  const [pagesPerSheet, setPagesPerSheet] = useState(1)
  const [pagesPerSheetMode, setPagesPerSheetMode] = useState<"preset" | "custom">("preset")
  const [customPagesPerSheet, setCustomPagesPerSheet] = useState(1)
  const [collate, setCollate] = useState(true)

  // TEMPORARY: Auto-login for testing
  useEffect(() => {
    const autoLogin = async () => {
      try {
        await login('student1', 'student123')
      } catch (error) {
        // Ignore errors
      }
    }
    autoLogin()
  }, [])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load uploaded documents from sessionStorage
        const storedDocs = sessionStorage.getItem('uploadedDocuments')
        if (storedDocs) {
          const docs = JSON.parse(storedDocs) as UploadedDocument[]
          setUploadedDocs(docs)
          if (docs.length > 0) {
            setSelectedDocId(docs[0].id)
          }
        } else {
          toast.error('Không có tài liệu nào được upload. Vui lòng quay lại trang upload.')
          router.push('/upload')
          return
        }

        // Load printers
        const printersData = await getAvailablePrinters()
        setPrinters(printersData.filter(p => p.isActive))

        // Load balance
        const balanceData = await getUserBalance()
        setBalance(balanceData.balancePages)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const selectedDoc = uploadedDocs.find(doc => doc.id === selectedDocId)
  const totalPageCount = selectedDoc?.pageCount || 0

  const calculateCost = () => {
    if (!selectedDoc) return 0
    
    // Parse page range
    let actualPages = totalPageCount
    if (pageRange === "custom" && customPageRange) {
      // Simple calculation - in real app, parse "1-5, 8" format
      // For now, assume all pages if custom range is provided
      actualPages = totalPageCount
    }

    // Calculate: ActualPages × Copies × SizeFactor
    const sizeFactor = paperSize === "A3" ? 2 : 1
    return actualPages * copies * sizeFactor
  }

  const handlePrint = async () => {
    if (!selectedDocId || !printerId) {
      toast.error('Vui lòng chọn tài liệu và máy in')
      return
    }

    const totalCost = calculateCost()
    if (totalCost > balance) {
      toast.error(`Không đủ số dư. Cần ${totalCost} trang, hiện có ${balance} trang.`)
      return
    }

    setSubmitting(true)
    try {
      // Advanced settings chỉ để hiển thị, không gửi lên BE
      console.log('Advanced settings:', {
        margins,
        scale: scale === "custom" ? customScale : scale,
        backgroundGraphics,
        colorMode,
        quality,
        pagesPerSheet,
        collate,
      })

      const result = await createPrintJob({
        printerId,
        documentId: selectedDocId,
        copies,
        paperSize,
        side: doubleSided ? 'DOUBLE_SIDED' : 'ONE_SIDED',
        orientation,
        pageRange: pageRange === "custom" ? customPageRange : undefined,
      })

      toast.success(`Tạo lệnh in thành công! Chi phí: ${result.job.totalCost} trang`)
      
      // Clear sessionStorage
      sessionStorage.removeItem('uploadedDocuments')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error('Error creating print job:', error)
      toast.error(error instanceof Error ? error.message : 'Lỗi khi tạo lệnh in')
    } finally {
      setSubmitting(false)
    }
  }

  const estimatedCost = calculateCost()
  const user = getCurrentUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userRole="student" balance={balance} userName={user?.username || "User"} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={balance} userName={user?.username || "User"} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Cấu hình in ấn</h1>
          <p className="text-gray-600">Thiết lập các tùy chọn in cho tài liệu của bạn</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Document Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">Tài liệu đã upload ({uploadedDocs.length} tệp)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selectedDocId === doc.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{doc.fileName}</div>
                        <div className="text-sm text-gray-500">{doc.pageCount} trang • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      {selectedDocId === doc.id && (
                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedDoc && (
                <div className="rounded-lg bg-gray-100 p-4">
                  <div className="text-center">
                    <FileText className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                    <p className="font-medium">{selectedDoc.fileName}</p>
                    <p className="text-sm text-gray-500">{selectedDoc.pageCount} trang</p>
                  </div>
                </div>
              )}
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
                  <span className="text-sm font-medium text-indigo-600">{estimatedCost} trang A4</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Printer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="printer">Máy in *</Label>
                  <Select value={printerId} onValueChange={setPrinterId}>
                    <SelectTrigger id="printer" className="bg-gray-50">
                      <SelectValue placeholder="Chọn máy in" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {p.location}
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
                      <SelectItem value="all">Tất cả ({totalPageCount} trang)</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh (ví dụ: 1-5, 8, 10-12)</SelectItem>
                    </SelectContent>
                  </Select>
                  {pageRange === "custom" && (
                    <Input
                      placeholder="1-5, 8, 10-12"
                      value={customPageRange}
                      onChange={(e) => setCustomPageRange(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Orientation */}
                <div className="space-y-2">
                  <Label htmlFor="orientation">Hướng giấy</Label>
                  <Select value={orientation} onValueChange={(v) => setOrientation(v as "PORTRAIT" | "LANDSCAPE")}>
                    <SelectTrigger id="orientation" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PORTRAIT">Dọc</SelectItem>
                      <SelectItem value="LANDSCAPE">Ngang</SelectItem>
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
                <div className="space-y-4 border-t pt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">Chế độ cài đặt khác</span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      {/* Margins */}
                      <div className="space-y-2">
                        <Label htmlFor="margins">Lề giấy</Label>
                        <Select value={margins} onValueChange={(v) => setMargins(v as typeof margins)}>
                          <SelectTrigger id="margins" className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Mặc định</SelectItem>
                            <SelectItem value="minimum">Tối thiểu</SelectItem>
                            <SelectItem value="none">Không có lề</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Scale */}
                      <div className="space-y-2">
                        <Label htmlFor="scale">Tỷ lệ</Label>
                        <Select value={scale} onValueChange={(v) => setScale(v as typeof scale)}>
                          <SelectTrigger id="scale" className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fit">Vừa với trang</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                            <SelectItem value="custom">Tùy chỉnh</SelectItem>
                          </SelectContent>
                        </Select>
                        {scale === "custom" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="50"
                              max="200"
                              value={customScale}
                              onChange={(e) => setCustomScale(Number.parseInt(e.target.value) || 100)}
                              className="bg-white"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        )}
                      </div>

                      {/* Color Mode */}
                      <div className="space-y-2">
                        <Label htmlFor="colorMode">Chế độ màu</Label>
                        <Select value={colorMode} onValueChange={(v) => setColorMode(v as typeof colorMode)}>
                          <SelectTrigger id="colorMode" className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="color">Màu</SelectItem>
                            <SelectItem value="grayscale">Đen trắng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quality */}
                      <div className="space-y-2">
                        <Label htmlFor="quality">Chất lượng</Label>
                        <Select value={quality} onValueChange={(v) => setQuality(v as typeof quality)}>
                          <SelectTrigger id="quality" className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Nháp (tiết kiệm mực)</SelectItem>
                            <SelectItem value="normal">Bình thường</SelectItem>
                            <SelectItem value="high">Chất lượng cao</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pages per Sheet */}
                      <div className="space-y-2">
                        <Label htmlFor="pagesPerSheet">Số trang mỗi tờ</Label>
                        <Select
                          value={pagesPerSheetMode === "preset" ? String(pagesPerSheet) : "custom"}
                          onValueChange={(v) => {
                            if (v === "custom") {
                              setPagesPerSheetMode("custom")
                            } else {
                              setPagesPerSheetMode("preset")
                              setPagesPerSheet(Number.parseInt(v))
                            }
                          }}
                        >
                          <SelectTrigger id="pagesPerSheet" className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 trang</SelectItem>
                            <SelectItem value="2">2 trang</SelectItem>
                            <SelectItem value="4">4 trang</SelectItem>
                            <SelectItem value="6">6 trang</SelectItem>
                            <SelectItem value="9">9 trang</SelectItem>
                            <SelectItem value="16">16 trang</SelectItem>
                            <SelectItem value="custom">Tùy chỉnh</SelectItem>
                          </SelectContent>
                        </Select>
                        {pagesPerSheetMode === "custom" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="32"
                              value={customPagesPerSheet}
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 1
                                setCustomPagesPerSheet(Math.max(1, Math.min(32, value)))
                                setPagesPerSheet(value)
                              }}
                              className="bg-white"
                              placeholder="Nhập số trang"
                            />
                            <span className="text-sm text-gray-500">trang (1-32)</span>
                          </div>
                        )}
                      </div>

                      {/* Background Graphics */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="backgroundGraphics" className="cursor-pointer">
                            In hình nền và màu
                          </Label>
                          <p className="text-xs text-gray-500">In màu nền và hình ảnh</p>
                        </div>
                        <Switch
                          id="backgroundGraphics"
                          checked={backgroundGraphics}
                          onCheckedChange={setBackgroundGraphics}
                        />
                      </div>

                      {/* Collate */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="collate" className="cursor-pointer">
                            Sắp xếp theo bộ
                          </Label>
                          <p className="text-xs text-gray-500">In từng bộ hoàn chỉnh</p>
                        </div>
                        <Switch id="collate" checked={collate} onCheckedChange={setCollate} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Số trang:</span>
                    <span className="font-semibold">{totalPageCount} trang</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Chi phí dự kiến:</span>
                    <span className="font-semibold text-indigo-600">{estimatedCost} trang A4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Số dư hiện tại:</span>
                    <span className="font-semibold">{balance} trang</span>
                  </div>
                </div>
                {estimatedCost > balance && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    Không đủ số dư. Cần {estimatedCost} trang, hiện có {balance} trang. Vui lòng mua thêm.
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/upload" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent" disabled={submitting}>
                      Quay lại
                    </Button>
                  </Link>
                  <Button
                    onClick={handlePrint}
                    disabled={!printerId || !selectedDocId || estimatedCost > balance || submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : estimatedCost > balance ? (
                      "Không đủ trang"
                    ) : (
                      "In ngay"
                    )}
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

