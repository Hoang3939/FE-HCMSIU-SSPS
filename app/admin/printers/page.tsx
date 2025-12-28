"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Printer, Plus, Edit, Trash2, Loader2, AlertCircle, Map, X } from "lucide-react"
import { printerAPI, type Printer as PrinterType } from "@/lib/api/printer-api"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dynamic import PrinterMap với ssr: false để tránh lỗi "window is not defined"
// react-leaflet cần chạy ở client-side, không thể render ở server-side
const PrinterMap = dynamic(
  () => import("@/components/admin/printer-map").then((mod) => ({ default: mod.PrinterMap })),
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

interface PrinterFormData {
  Name: string
  Brand: string
  Model: string
  Description: string
  Status: "AVAILABLE" | "BUSY" | "OFFLINE" | "MAINTENANCE" | "ERROR"
  IPAddress: string
  CUPSPrinterName: string
  LocationID: string
  IsActive: boolean
}

export default function PrinterManagementPage() {
  const { toast } = useToast()
  const [printers, setPrinters] = useState<PrinterType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [printerToDelete, setPrinterToDelete] = useState<PrinterType | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState<PrinterFormData>({
    Name: "",
    Brand: "",
    Model: "",
    Description: "",
    Status: "OFFLINE",
    IPAddress: "",
    CUPSPrinterName: "",
    LocationID: "",
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
    } catch (err: any) {
      console.error("Error loading printers:", err)
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          "Không thể tải danh sách máy in"
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
      LocationID: "",
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
      LocationID: printer.LocationID || "",
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
        const locationID = formData.LocationID?.trim();
        const updated = await printerAPI.updatePrinter(editingPrinter.PrinterID, {
          Name: formData.Name,
          Brand: formData.Brand?.trim() || undefined,
          Model: formData.Model?.trim() || undefined,
          Description: formData.Description?.trim() || undefined,
          Status: formData.Status,
          IPAddress: formData.IPAddress?.trim() || undefined,
          CUPSPrinterName: formData.CUPSPrinterName?.trim() || undefined,
          LocationID: locationID && locationID.length > 0 ? locationID : null,
          IsActive: formData.IsActive,
        })
        setPrinters(printers.map((p) => (p.PrinterID === editingPrinter.PrinterID ? updated : p)))
        toast({
          title: "Thành công",
          description: "Cập nhật máy in thành công",
        })
      } else {
        // Create new printer
        const locationID = formData.LocationID?.trim();
        const created = await printerAPI.createPrinter({
          Name: formData.Name,
          Brand: formData.Brand?.trim() || undefined,
          Model: formData.Model?.trim() || undefined,
          Description: formData.Description?.trim() || undefined,
          Status: formData.Status,
          IPAddress: formData.IPAddress?.trim() || undefined,
          CUPSPrinterName: formData.CUPSPrinterName?.trim() || undefined,
          LocationID: locationID && locationID.length > 0 ? locationID : undefined,
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

  const handleDeleteClick = (printer: PrinterType) => {
    setPrinterToDelete(printer)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletePrinter = async () => {
    if (!printerToDelete) return

    try {
      setDeleting(true)
      await printerAPI.deletePrinter(printerToDelete.PrinterID)
      setPrinters(printers.filter((p) => p.PrinterID !== printerToDelete.PrinterID))
      setIsDeleteDialogOpen(false)
      setPrinterToDelete(null)
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
    } finally {
      setDeleting(false)
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


  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Quản lý máy in</h1>
        <p className="text-gray-400">Thêm, sửa, xóa và quản lý trạng thái máy in</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-[#1a1a1a] border-[#2a2a2a] w-full">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white data-[state=active]:border-[#4a4a4a] text-gray-400 border border-transparent px-6 py-2.5 text-base flex-1"
          >
            <Printer className="mr-2 h-5 w-5" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger 
            value="map" 
            className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white data-[state=active]:border-[#4a4a4a] text-gray-400 border border-transparent px-6 py-2.5 text-base flex-1"
          >
            <Map className="mr-2 h-5 w-5" />
            Bản đồ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <PrinterMap 
            printers={[]}
            onLocationUpdate={loadPrinters}
          />
        </TabsContent>

        <TabsContent value="list">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-semibold text-xl">Danh sách máy in</CardTitle>
                  <CardDescription className="text-gray-400 mt-1">
                    Quản lý và theo dõi tất cả các máy in trong hệ thống
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddPrinter} className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm máy in
                    </Button>
                  </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">{editingPrinter ? "Sửa máy in" : "Thêm máy in mới"}</DialogTitle>
                <DialogDescription className="text-gray-400">
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
                  <Label htmlFor="locationID">ID Vị trí (Location ID)</Label>
                  <Input
                    id="locationID"
                    value={formData.LocationID}
                    onChange={(e) => setFormData({ ...formData, LocationID: e.target.value })}
                    placeholder="UUID của vị trí (tùy chọn)"
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
                    <SelectTrigger className="w-full">
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
                    className="data-[state=checked]:bg-[#3a82f6] data-[state=checked]:border-[#3a82f6]"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Kích hoạt máy in
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  disabled={saving}
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a] hover:text-white"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleSavePrinter} 
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPrinter ? "Cập nhật" : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-500 bg-red-900/20 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Đang tải danh sách máy in...</span>
          </div>
        ) : printers.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <CardContent className="pt-6">
              <div className="text-center text-gray-400">
                <Printer className="mx-auto mb-2 h-12 w-12" />
                <p>Chưa có máy in nào. Hãy thêm máy in mới để bắt đầu.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Printers List */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer) => (
              <Card key={printer.PrinterID} className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a2a2a]">
                        <Printer className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">
                          {printer.Name}
                        </CardTitle>
                        <CardDescription className="mt-1 text-gray-400">
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
                  <div className="space-y-2 text-sm text-gray-300">
                    {printer.Description && (
                      <div>
                        <span className="font-medium text-white">Mô tả:</span> {printer.Description}
                      </div>
                    )}
                    {printer.IPAddress && (
                      <div>
                        <span className="font-medium text-white">IP:</span> {printer.IPAddress}
                      </div>
                    )}
                    {printer.CUPSPrinterName && (
                      <div>
                        <span className="font-medium text-white">CUPS:</span> {printer.CUPSPrinterName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          printer.Status === 'AVAILABLE' ? 'bg-green-900/30 text-green-400' :
                          printer.Status === 'BUSY' ? 'bg-yellow-900/30 text-yellow-400' :
                          printer.Status === 'OFFLINE' ? 'bg-gray-800 text-gray-400' :
                          printer.Status === 'MAINTENANCE' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {getStatusLabel(printer.Status)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          printer.IsActive
                            ? "bg-green-900/30 text-green-400"
                            : "bg-gray-800 text-gray-400"
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
                      className="flex-1 border-[#2a2a2a] bg-white text-[#1a1a1a] hover:bg-gray-100 hover:text-[#0a0a0a]"
                      onClick={() => handleEditPrinter(printer)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                      onClick={() => handleDeleteClick(printer)}
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
          <div className="relative">
            {/* Close Icon */}
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none z-10"
              disabled={deleting}
            >
              <X className="h-5 w-5" />
            </button>

            <AlertDialogHeader>
              <AlertDialogTitle className="text-white font-bold text-lg pr-8">
                Xác nhận xóa máy in
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-sm mt-2">
                Bạn có chắc chắn muốn xóa máy in <span className="font-semibold text-white">{printerToDelete?.Name}</span> không? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a] hover:text-white"
                disabled={deleting}
              >
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePrinter}
                className="bg-[#7f1d1d] hover:bg-[#991b1b] text-white border-0"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xác nhận xóa"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

