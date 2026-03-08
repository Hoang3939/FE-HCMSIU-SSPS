"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/shared/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getAvailablePrinters } from "@/lib/api"

// Dynamic import PrinterMap với ssr: false để tránh lỗi "window is not defined"
// react-leaflet cần chạy ở client-side, không thể render ở server-side
const PrinterMap = dynamic(
  () => import("@/components/student/printer-map").then((mod) => ({ default: mod.PrinterMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="text-center text-gray-400">
          <div className="mb-2 text-lg">Đang tải bản đồ...</div>
          <div className="text-sm">Vui lòng đợi...</div>
        </div>
      </div>
    )
  }
)

interface PrinterInfo {
  id: string
  name: string
  brand: string | null
  model: string | null
  location: string
  status: "available" | "busy" | "offline" | "maintenance" | "error"
}

export default function PrintersPage() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | undefined>()
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPrinters() {
      try {
        setLoading(true)
        setError(null)
        const data = await getAvailablePrinters() as Array<{
          id: string
          name: string
          brand: string | null
          model: string | null
          location: string
          status: string
        }>
        
        // Map backend status to frontend status
        const mappedPrinters: PrinterInfo[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          model: p.model,
          location: p.location || "Chưa xác định",
          status: mapStatus(p.status),
        }))
        
        setPrinters(mappedPrinters)
      } catch (err) {
        console.error("Error fetching printers:", err)
        setError("Không thể tải danh sách máy in. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchPrinters()
  }, [])

  const mapStatus = (status: string): "available" | "busy" | "offline" | "maintenance" | "error" => {
    switch (status.toUpperCase()) {
      case "AVAILABLE":
        return "available"
      case "BUSY":
        return "busy"
      case "OFFLINE":
        return "offline"
      case "MAINTENANCE":
        return "maintenance"
      case "ERROR":
        return "error"
      default:
        return "offline"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Sẵn sàng
          </Badge>
        )
      case "busy":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <XCircle className="mr-1 h-3 w-3" />
            Đang bận
          </Badge>
        )
      case "offline":
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <XCircle className="mr-1 h-3 w-3" />
            Tạm dừng
          </Badge>
        )
      case "maintenance":
        return (
          <Badge className="bg-orange-100 text-orange-700">
            <XCircle className="mr-1 h-3 w-3" />
            Bảo trì
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            Lỗi
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <XCircle className="mr-1 h-3 w-3" />
            Không xác định
          </Badge>
        )
    }
  }

  const getDisplayName = (printer: PrinterInfo) => {
    // Backend returns name in format "name - BUILDINGROOM"
    // Extract just the printer name part (before " - ")
    const nameParts = printer.name.split(" - ")
    return nameParts[0] || printer.name
  }

  const getDescription = (printer: PrinterInfo) => {
    if (printer.brand && printer.model) {
      return `Máy in ${printer.brand} ${printer.model}`
    }
    // If no brand/model, try to extract from name
    const nameParts = printer.name.split(" - ")
    if (nameParts.length > 1) {
      return nameParts[0]
    }
    return "Máy in"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={50} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Danh sách máy in</h1>
          <p className="text-gray-600">Tìm máy in gần bạn và xem trạng thái</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Đang tải danh sách máy in...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        ) : printers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-gray-600">Không có máy in nào khả dụng.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer) => (
              <Card key={printer.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                        <Printer className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {getDisplayName(printer)}
                        </CardTitle>
                        <CardDescription className="mt-1">{getDescription(printer)}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(printer.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{printer.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Map Section */}
        <div className="mt-8">
          <PrinterMap 
            selectedPrinterId={selectedPrinterId}
            onPrinterSelect={setSelectedPrinterId}
          />
        </div>
      </main>
    </div>
  )
}

