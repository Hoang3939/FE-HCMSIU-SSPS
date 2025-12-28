"use client"

import { useState } from "react"
import { Header } from "@/components/shared/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, MapPin, CheckCircle, XCircle } from "lucide-react"
import { PrinterMap } from "@/components/student/printer-map"

interface PrinterInfo {
  id: string
  brand: string
  model: string
  description: string
  campus: string
  building: string
  room: string
  status: "available" | "busy" | "offline"
}

export default function PrintersPage() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | undefined>()

  const printers: PrinterInfo[] = [
    {
      id: "h6-101",
      brand: "HP",
      model: "LaserJet Pro",
      description: "Máy in laser màu, tốc độ cao",
      campus: "Campus 1",
      building: "Tòa H6",
      room: "101",
      status: "available",
    },
    {
      id: "h6-102",
      brand: "Canon",
      model: "PIXMA",
      description: "Máy in phun màu, chất lượng cao",
      campus: "Campus 1",
      building: "Tòa H6",
      room: "102",
      status: "available",
    },
    {
      id: "lewis-102",
      brand: "Epson",
      model: "WorkForce",
      description: "Máy in đa chức năng",
      campus: "Campus 1",
      building: "Lewis Hall",
      room: "102",
      status: "busy",
    },
    {
      id: "duc-101",
      brand: "HP",
      model: "OfficeJet",
      description: "Máy in văn phòng",
      campus: "Campus 1",
      building: "Tòa Đức",
      room: "101",
      status: "offline",
    },
  ]

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
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={50} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Danh sách máy in</h1>
          <p className="text-gray-600">Tìm máy in gần bạn và xem trạng thái</p>
        </div>

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
                        {printer.brand} {printer.model}
                      </CardTitle>
                      <CardDescription className="mt-1">{printer.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(printer.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {printer.campus} - {printer.building}, Phòng {printer.room}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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

