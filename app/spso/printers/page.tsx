"use client"

import { useState } from "react"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Printer, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react"

interface PrinterData {
  id: string
  brand: string
  model: string
  description: string
  campus: string
  building: string
  room: string
  status: "enabled" | "disabled"
}

export default function PrinterManagementPage() {
  const [printers, setPrinters] = useState<PrinterData[]>([
    {
      id: "h6-101",
      brand: "HP",
      model: "LaserJet Pro",
      description: "Máy in laser màu",
      campus: "Campus 1",
      building: "Tòa H6",
      room: "101",
      status: "enabled",
    },
    {
      id: "h6-102",
      brand: "Canon",
      model: "PIXMA",
      description: "Máy in phun màu",
      campus: "Campus 1",
      building: "Tòa H6",
      room: "102",
      status: "enabled",
    },
    {
      id: "lewis-102",
      brand: "Epson",
      model: "WorkForce",
      description: "Máy in đa chức năng",
      campus: "Campus 1",
      building: "Lewis Hall",
      room: "102",
      status: "disabled",
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<PrinterData | null>(null)
  const [formData, setFormData] = useState<Partial<PrinterData>>({
    brand: "",
    model: "",
    description: "",
    campus: "",
    building: "",
    room: "",
    status: "enabled",
  })

  const handleAddPrinter = () => {
    setEditingPrinter(null)
    setFormData({
      brand: "",
      model: "",
      description: "",
      campus: "",
      building: "",
      room: "",
      status: "enabled",
    })
    setIsDialogOpen(true)
  }

  const handleEditPrinter = (printer: PrinterData) => {
    setEditingPrinter(printer)
    setFormData(printer)
    setIsDialogOpen(true)
  }

  const handleSavePrinter = () => {
    if (editingPrinter) {
      // Update existing printer
      setPrinters(printers.map((p) => (p.id === editingPrinter.id ? { ...formData, id: p.id } as PrinterData : p)))
    } else {
      // Add new printer
      const newPrinter: PrinterData = {
        id: `printer-${Date.now()}`,
        ...formData,
      } as PrinterData
      setPrinters([...printers, newPrinter])
    }
    setIsDialogOpen(false)
  }

  const handleDeletePrinter = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa máy in này?")) {
      setPrinters(printers.filter((p) => p.id !== id))
    }
  }

  const togglePrinterStatus = (id: string) => {
    setPrinters(
      printers.map((p) =>
        p.id === id ? { ...p, status: p.status === "enabled" ? "disabled" : "enabled" } : p
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="spso" userName="Admin SPSO" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Quản lý máy in</h1>
            <p className="mt-2 text-gray-600">Thêm, sửa, xóa và quản lý trạng thái máy in</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddPrinter} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Thêm máy in
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPrinter ? "Sửa máy in" : "Thêm máy in mới"}</DialogTitle>
                <DialogDescription>
                  {editingPrinter ? "Cập nhật thông tin máy in" : "Điền thông tin máy in mới"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Hãng *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="HP, Canon, Epson..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="LaserJet Pro..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả ngắn về máy in..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus *</Label>
                  <Input
                    id="campus"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    placeholder="Campus 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building">Tòa nhà *</Label>
                  <Input
                    id="building"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="Tòa H6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Phòng *</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "enabled" | "disabled") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Kích hoạt</SelectItem>
                      <SelectItem value="disabled">Vô hiệu hóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSavePrinter} className="bg-indigo-600 hover:bg-indigo-700">
                  {editingPrinter ? "Cập nhật" : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Printers List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {printers.map((printer) => (
            <Card key={printer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                      <Printer className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{printer.brand} {printer.model}</CardTitle>
                      <CardDescription className="mt-1">
                        {printer.building} - Phòng {printer.room}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={printer.status === "enabled"}
                      onCheckedChange={() => togglePrinterStatus(printer.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Campus:</span> {printer.campus}
                  </div>
                  <div>
                    <span className="font-medium">Mô tả:</span> {printer.description || "Không có"}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        printer.status === "enabled"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {printer.status === "enabled" ? "Hoạt động" : "Tạm dừng"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditPrinter(printer)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => handleDeletePrinter(printer.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

