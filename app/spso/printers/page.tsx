"use client"

import { useState, useEffect } from "react"
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
import { Printer, Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react"
import { printerAPI, type Printer as PrinterType } from "@/lib/api/printer-api"
import { useToast } from "@/hooks/use-toast"

interface PrinterFormData {
  Name: string
  Brand: string
  Model: string
  Description: string
  Status: "AVAILABLE" | "BUSY" | "OFFLINE" | "MAINTENANCE" | "ERROR"
  IPAddress: string
  CUPSPrinterName: string
  IsActive: boolean
}

export default function PrinterManagementPage() {
  const { toast } = useToast()
  const [printers, setPrinters] = useState<PrinterType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<PrinterFormData>({
    Name: "",
    Brand: "",
    Model: "",
    Description: "",
    Status: "OFFLINE",
    IPAddress: "",
    CUPSPrinterName: "",
    IsActive: true,
  })

  // Load printers từ API
  useEffect(() => {
    loadPrinters()
  }, [])

  const loadPrinters = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await printerAPI.getPrinters({ limit: 100 })
      setPrinters(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách máy in"
      setError(errorMessage)
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrinter = () => {
    setEditingPrinter(null)
    setFormData({
      Name: "",
      Brand: "",
      Model: "",
      Description: "",
      Status: "OFFLINE",
      IPAddress: "",
      CUPSPrinterName: "",
      IsActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditPrinter = (printer: PrinterType) => {
    setEditingPrinter(printer)
    setFormData({
      Name: printer.Name,
      Brand: printer.Brand || "",
      Model: printer.Model || "",
      Description: printer.Description || "",
      Status: printer.Status,
      IPAddress: printer.IPAddress || "",
      CUPSPrinterName: printer.CUPSPrinterName || "",
      IsActive: printer.IsActive,
    })
    setIsDialogOpen(true)
  }

  const handleSavePrinter = async () => {
    if (!formData.Name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên máy in là bắt buộc",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      if (editingPrinter) {
        // Update existing printer
        const updated = await printerAPI.updatePrinter(editingPrinter.PrinterID, {
          Name: formData.Name,
          Brand: formData.Brand || undefined,
          Model: formData.Model || undefined,
          Description: formData.Description || undefined,
          Status: formData.Status,
          IPAddress: formData.IPAddress || undefined,
          CUPSPrinterName: formData.CUPSPrinterName || undefined,
          IsActive: formData.IsActive,
        })
        setPrinters(printers.map((p) => (p.PrinterID === editingPrinter.PrinterID ? updated : p)))
        toast({
          title: "Thành công",
          description: "Cập nhật máy in thành công",
        })
      } else {
        // Create new printer
        const created = await printerAPI.createPrinter({
          Name: formData.Name,
          Brand: formData.Brand || undefined,
          Model: formData.Model || undefined,
          Description: formData.Description || undefined,
          Status: formData.Status,
          IPAddress: formData.IPAddress || undefined,
          CUPSPrinterName: formData.CUPSPrinterName || undefined,
          IsActive: formData.IsActive,
        })
        setPrinters([...printers, created])
        toast({
          title: "Thành công",
          description: "Thêm máy in mới thành công",
        })
      }
      setIsDialogOpen(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrinter = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa máy in này?")) {
      return
    }

    try {
      await printerAPI.deletePrinter(id)
      setPrinters(printers.filter((p) => p.PrinterID !== id))
      toast({
        title: "Thành công",
        description: "Xóa máy in thành công",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa máy in"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const togglePrinterStatus = async (printer: PrinterType) => {
    try {
      const updated = await printerAPI.updatePrinter(printer.PrinterID, {
        IsActive: !printer.IsActive,
      })
      setPrinters(printers.map((p) => (p.PrinterID === printer.PrinterID ? updated : p)))
      toast({
        title: "Thành công",
        description: updated.IsActive ? "Kích hoạt máy in thành công" : "Tạm dừng máy in thành công",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật trạng thái"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      AVAILABLE: "Sẵn sàng",
      BUSY: "Đang bận",
      OFFLINE: "Tạm dừng",
      MAINTENANCE: "Bảo trì",
      ERROR: "Lỗi",
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      AVAILABLE: "bg-green-50 text-green-600",
      BUSY: "bg-yellow-50 text-yellow-600",
      OFFLINE: "bg-gray-100 text-gray-600",
      MAINTENANCE: "bg-blue-50 text-blue-600",
      ERROR: "bg-red-50 text-red-600",
    }
    return colorMap[status] || "bg-gray-100 text-gray-600"
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Tên máy in *</Label>
                  <Input
                    id="name"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    placeholder="Máy in H6-101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Hãng</Label>
                  <Input
                    id="brand"
                    value={formData.Brand}
                    onChange={(e) => setFormData({ ...formData, Brand: e.target.value })}
                    placeholder="HP, Canon, Epson..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.Model}
                    onChange={(e) => setFormData({ ...formData, Model: e.target.value })}
                    placeholder="LaserJet Pro..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.Description}
                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    placeholder="Mô tả ngắn về máy in..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">Địa chỉ IP</Label>
                  <Input
                    id="ipAddress"
                    value={formData.IPAddress}
                    onChange={(e) => setFormData({ ...formData, IPAddress: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cupsPrinterName">Tên máy in CUPS</Label>
                  <Input
                    id="cupsPrinterName"
                    value={formData.CUPSPrinterName}
                    onChange={(e) => setFormData({ ...formData, CUPSPrinterName: e.target.value })}
                    placeholder="printer-h6-101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.Status}
                    onValueChange={(value: PrinterFormData["Status"]) =>
                      setFormData({ ...formData, Status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
                      <SelectItem value="BUSY">Đang bận</SelectItem>
                      <SelectItem value="OFFLINE">Tạm dừng</SelectItem>
                      <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                      <SelectItem value="ERROR">Lỗi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-center gap-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.IsActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Kích hoạt máy in
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleSavePrinter} 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPrinter ? "Cập nhật" : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Đang tải danh sách máy in...</span>
          </div>
        ) : printers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <Printer className="mx-auto mb-2 h-12 w-12" />
                <p>Chưa có máy in nào. Hãy thêm máy in mới để bắt đầu.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Printers List */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer) => (
              <Card key={printer.PrinterID}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                        <Printer className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {printer.Name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {printer.Brand && printer.Model
                            ? `${printer.Brand} ${printer.Model}`
                            : printer.Brand || printer.Model || "Không có thông tin"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={printer.IsActive}
                        onCheckedChange={() => togglePrinterStatus(printer)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {printer.Description && (
                      <div>
                        <span className="font-medium">Mô tả:</span> {printer.Description}
                      </div>
                    )}
                    {printer.IPAddress && (
                      <div>
                        <span className="font-medium">IP:</span> {printer.IPAddress}
                      </div>
                    )}
                    {printer.CUPSPrinterName && (
                      <div>
                        <span className="font-medium">CUPS:</span> {printer.CUPSPrinterName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(printer.Status)}`}
                      >
                        {getStatusLabel(printer.Status)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          printer.IsActive
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {printer.IsActive ? "Hoạt động" : "Tạm dừng"}
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
                      onClick={() => handleDeletePrinter(printer.PrinterID)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

