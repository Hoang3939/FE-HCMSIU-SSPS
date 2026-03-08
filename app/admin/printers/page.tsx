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
import { Printer, Plus, Edit, Trash2, Loader2, AlertCircle, Map, X, Eye, Search, Filter } from "lucide-react"
import { printerAPI, type Printer as PrinterType } from "@/lib/api/printer-api"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AxiosError } from "axios"

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
  Building: string
  Room: string
  IsActive: boolean
}

export default function PrinterManagementPage() {
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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [printerToView, setPrinterToView] = useState<PrinterType | null>(null)
  const [formErrors, setFormErrors] = useState<{
    Name?: string
    IPAddress?: string
  }>({})
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isFiltered, setIsFiltered] = useState<boolean>(false)
  const [formData, setFormData] = useState<PrinterFormData>({
    Name: "",
    Brand: "",
    Model: "",
    Description: "",
    Status: "OFFLINE",
    IPAddress: "",
    CUPSPrinterName: "",
    Building: "",
    Room: "",
    IsActive: true,
  })

  // Load printers từ API
  useEffect(() => {
    loadPrinters()
  }, [])

  const loadPrinters = async (search?: string, status?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params: any = { limit: 100 }
      if (search && search.trim()) {
        params.search = search.trim()
      }
      if (status && status.trim()) {
        params.status = status.trim()
      }
      const response = await printerAPI.getPrinters(params)
      setPrinters(response.data)
    } catch (err: any) {
      console.error("Error loading printers:", err)
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          "Không thể tải danh sách máy in"
      setError(errorMessage)
      toast.error("Lỗi", {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    if (!isFiltered) {
      // Apply filter
      loadPrinters(searchQuery, statusFilter)
      setIsFiltered(true)
    } else {
      // Clear filter - reset all filter states
      // Reset status filter first to ensure UI updates
      setStatusFilter("")
      setSearchQuery("")
      setIsFiltered(false)
      // Reload printers without filters
      loadPrinters()
    }
  }

  const handleAddPrinter = () => {
    setEditingPrinter(null)
    setFormErrors({})
    setFormData({
      Name: "",
      Brand: "",
      Model: "",
      Description: "",
      Status: "OFFLINE",
      IPAddress: "",
      CUPSPrinterName: "",
      Building: "",
      Room: "",
      IsActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditPrinter = (printer: PrinterType) => {
    setEditingPrinter(printer)
    setFormErrors({})
    // Load Building and Room from printer data (these should come from backend now)
    setFormData({
      Name: printer.Name,
      Brand: printer.Brand || "",
      Model: printer.Model || "",
      Description: printer.Description || "",
      Status: printer.Status,
      IPAddress: printer.IPAddress || "",
      CUPSPrinterName: printer.CUPSPrinterName || "",
      Building: (printer as any).Building || "",
      Room: (printer as any).Room || "",
      IsActive: printer.IsActive,
    })
    setIsDialogOpen(true)
  }

  const handleSavePrinter = async () => {
    // Prevent duplicate submissions
    if (saving) {
      console.log('[Frontend] handleSavePrinter: Already saving, ignoring duplicate click')
      return
    }

    // Clear previous errors
    setFormErrors({})

    if (!formData.Name.trim()) {
      console.log('[Frontend] handleSavePrinter: Validation failed - Name is required')
      setFormErrors({ Name: "Tên máy in là bắt buộc" })
      toast.error("Lỗi", {
        description: "Tên máy in là bắt buộc",
      })
      return
    }

    try {
      setSaving(true)
      
      if (editingPrinter) {
        // Update existing printer
        const updatePayload = {
          Name: formData.Name,
          Brand: formData.Brand?.trim() || undefined,
          Model: formData.Model?.trim() || undefined,
          Description: formData.Description?.trim() || undefined,
          Status: formData.Status,
          IPAddress: formData.IPAddress?.trim() || undefined,
          CUPSPrinterName: formData.CUPSPrinterName?.trim() || undefined,
          Building: formData.Building?.trim() || undefined,
          Room: formData.Room?.trim() || undefined,
          IsActive: formData.IsActive,
        }
        console.log('[Frontend] handleSavePrinter: Updating printer', {
          printerID: editingPrinter.PrinterID,
          payload: updatePayload
        })
        
        const updated = await printerAPI.updatePrinter(editingPrinter.PrinterID, updatePayload)
        console.log('[Frontend] handleSavePrinter: Update successful', updated)
        
        // Refresh the list to get the latest data (keep current filters if any)
        await loadPrinters(isFiltered ? searchQuery : undefined, isFiltered ? statusFilter : undefined)
        setFormErrors({})
        
        // Show success toast immediately after successful update
        toast.success("Thành công", {
          description: "Cập nhật máy in thành công",
        })
        
        setIsDialogOpen(false)
      } else {
        // Create new printer
        const createPayload = {
          Name: formData.Name,
          Brand: formData.Brand?.trim() || undefined,
          Model: formData.Model?.trim() || undefined,
          Description: formData.Description?.trim() || undefined,
          Status: formData.Status,
          IPAddress: formData.IPAddress?.trim() || undefined,
          CUPSPrinterName: formData.CUPSPrinterName?.trim() || undefined,
          Building: formData.Building?.trim() || undefined,
          Room: formData.Room?.trim() || undefined,
          IsActive: formData.IsActive,
        }
        console.log('[Frontend] handleSavePrinter: Creating new printer', {
          payload: createPayload,
          formData: formData
        })
        
        const created = await printerAPI.createPrinter(createPayload)
        console.log('[Frontend] handleSavePrinter: Create successful', created)
        
        // Refresh the list to show the new printer (keep current filters if any)
        await loadPrinters(isFiltered ? searchQuery : undefined, isFiltered ? statusFilter : undefined)
        console.log('[Frontend] handleSavePrinter: List refreshed, showing success toast and closing modal')
        setFormErrors({})
        
        // Show success toast immediately after successful creation
        toast.success("Thành công", {
          description: "Thêm máy in mới thành công",
        })
        
        setIsDialogOpen(false)
      }
    } catch (err: unknown) {
      // Use AxiosError type guard to safely access error.response
      if (err instanceof AxiosError) {
        const responseStatus = err.response?.status
        const responseData = err.response?.data as { code?: string; message?: string; error?: string } | undefined
        const errorCode = responseData?.code
        const errorMessage = responseData?.message

        console.error('[Frontend] handleSavePrinter: AxiosError occurred', {
          status: responseStatus,
          code: errorCode,
          data: responseData,
          message: err.message
        })

        // Handle 409 Conflict (duplicate Name or IPAddress)
        if (responseStatus === 409) {
          console.log('[Frontend] handleSavePrinter: 409 Conflict detected, showing error toast', {
            status: responseStatus,
            code: errorCode,
            message: errorMessage,
            fullResponseData: responseData
          })

          // Xử lý DUPLICATE_NAME theo yêu cầu
          if (errorCode === 'DUPLICATE_NAME') {
            console.log('[Frontend] handleSavePrinter: DUPLICATE_NAME detected, showing toast')
            setFormErrors({ Name: "Tên máy in này đã tồn tại trong hệ thống. Vui lòng chọn tên khác." })
            toast.error("Lỗi trùng lặp", {
              description: "Tên máy in này đã tồn tại trong hệ thống. Vui lòng chọn tên khác.",
            })
            // Modal stays open so user can fix the name
            return
          }

          // Xử lý DUPLICATE_IP theo yêu cầu
          if (errorCode === 'DUPLICATE_IP') {
            console.log('[Frontend] handleSavePrinter: DUPLICATE_IP detected, showing toast and field error')
            const ipErrorMsg = errorMessage || "Địa chỉ IP này đã được sử dụng bởi máy in khác. Vui lòng sử dụng địa chỉ IP khác."
            setFormErrors({ IPAddress: ipErrorMsg })
            toast.error("Lỗi trùng lặp địa chỉ IP", {
              description: ipErrorMsg,
            })
            // Modal stays open so user can fix the IP address
            return
          }

          // Fallback cho các lỗi 409 khác
          console.log('[Frontend] handleSavePrinter: 409 Conflict fallback, showing toast')
          toast.error("Lỗi trùng lặp", {
            description: errorMessage || "Đã có lỗi xảy ra, vui lòng thử lại sau.",
          })
          // Modal stays open so user can retry
          return
        }

        // Handle 400 Bad Request (validation errors)
        if (responseStatus === 400) {
          console.log('[Frontend] handleSavePrinter: 400 Bad Request detected, showing error toast', {
            status: responseStatus,
            message: errorMessage
          })
          toast.error("Lỗi", {
            description: errorMessage || "Đã có lỗi xảy ra, vui lòng thử lại sau.",
          })
          // Modal stays open so user can fix the data
          return
        }

        // Handle 401 Unauthorized
        if (responseStatus === 401) {
          toast.error("Lỗi xác thực", {
            description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          })
          return
        }

        // Handle other HTTP errors (500, etc.)
        console.log('[Frontend] handleSavePrinter: Showing generic error toast', {
          status: responseStatus,
          message: errorMessage
        })
        toast.error("Lỗi", {
          description: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
        })
        // Modal stays open on error so user can retry
        return
      }

      // Handle non-Axios errors (network errors, etc.)
      const errorMessage = err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại sau."
      console.error('[Frontend] handleSavePrinter: Non-AxiosError occurred', {
        error: err,
        message: errorMessage
      })
      toast.error("Lỗi", {
        description: errorMessage,
      })
      // Modal stays open on error so user can retry
    } finally {
      setSaving(false)
      console.log('[Frontend] handleSavePrinter: Finished, saving state reset')
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
      
      // 1. Call API
      await printerAPI.deletePrinter(printerToDelete.PrinterID)
      
      // 2. IMPORTANT: Refresh the list immediately (keep current filters if any)
      await loadPrinters(isFiltered ? searchQuery : undefined, isFiltered ? statusFilter : undefined)
      
      // 3. Show Success Toast
      toast.success("Đã xóa máy in thành công!")
      
      // 4. Close Modal
      setIsDeleteDialogOpen(false)
      setPrinterToDelete(null)
    } catch (error) {
      console.error('[Frontend] handleDeletePrinter: Error occurred', error)
      toast.error("Xóa thất bại. Vui lòng thử lại.")
      // Keep modal open on error so user can retry
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
      toast.success("Thành công", {
        description: updated.IsActive ? "Kích hoạt máy in thành công" : "Tạm dừng máy in thành công",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật trạng thái"
      toast.error("Lỗi", {
        description: errorMessage,
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

  const handleViewDetails = (printer: PrinterType) => {
    setPrinterToView(printer)
    setIsDetailDialogOpen(true)
  }


  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Quản lý máy in</h1>
        <p className="text-gray-400">Thêm, sửa, xóa và quản lý trạng thái máy in</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-[#1a1a1a] border-[#2a2a2a] w-full gap-0">
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
          {/* Search and Filter Toolbar */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo tên, IP, hãng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isFiltered) {
                          handleFilter()
                        }
                      }}
                      className="pl-10 h-9 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                    />
                  </div>
                </div>

                {/* Status Select */}
                <div className="w-full sm:w-[200px]">
                  <Select
                    key={isFiltered ? 'filtered' : 'unfiltered'}
                    value={statusFilter || undefined}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="h-9 bg-[#2a2a2a] border-[#3a3a3a] text-white focus:ring-[#4a4a4a]">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                      <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
                      <SelectItem value="BUSY">Đang bận</SelectItem>
                      <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                      <SelectItem value="OFFLINE">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter/Reset Button */}
                <Button
                  onClick={handleFilter}
                  variant={isFiltered ? "destructive" : "default"}
                  className={`h-9 ${
                    isFiltered 
                      ? "bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-900/50" 
                      : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-[#3a3a3a]"
                  }`}
                >
                  {isFiltered ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Xóa bộ lọc
                    </>
                  ) : (
                    <>
                      <Filter className="mr-2 h-4 w-4" />
                      Lọc
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                    onChange={(e) => {
                      setFormData({ ...formData, Name: e.target.value })
                      if (formErrors.Name) setFormErrors({ ...formErrors, Name: undefined })
                    }}
                    placeholder="Máy in H6-101"
                    required
                    className={formErrors.Name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.Name && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.Name}
                    </p>
                  )}
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
                    onChange={(e) => {
                      setFormData({ ...formData, IPAddress: e.target.value })
                      if (formErrors.IPAddress) setFormErrors({ ...formErrors, IPAddress: undefined })
                    }}
                    placeholder="192.168.1.100"
                    className={formErrors.IPAddress ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.IPAddress && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.IPAddress}
                    </p>
                  )}
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
                  <Label htmlFor="building">Tòa nhà (Building)</Label>
                  <Input
                    id="building"
                    value={formData.Building}
                    onChange={(e) => setFormData({ ...formData, Building: e.target.value })}
                    placeholder="Ví dụ: LEW, H6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Phòng (Room)</Label>
                  <Input
                    id="room"
                    value={formData.Room}
                    onChange={(e) => setFormData({ ...formData, Room: e.target.value })}
                    placeholder="Ví dụ: 404, 101"
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
                      className="flex-1 border-[#2a2a2a] bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                      onClick={() => handleViewDetails(printer)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Chi tiết
                    </Button>
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

      {/* View Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Chi tiết máy in
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Thông tin đầy đủ về máy in
            </DialogDescription>
          </DialogHeader>
          
          {printerToView && (
            <div className="grid gap-6 py-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-semibold text-gray-400">Tên máy in</Label>
                <div className="text-base text-white font-medium">{printerToView.Name}</div>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Hãng</Label>
                <div className="text-base text-white">{printerToView.Brand ? printerToView.Brand : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Model</Label>
                <div className="text-base text-white">{printerToView.Model ? printerToView.Model : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-semibold text-gray-400">Mô tả</Label>
                <div className="text-base text-white whitespace-pre-wrap">{printerToView.Description ? printerToView.Description : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* IP Address */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Địa chỉ IP</Label>
                <div className="text-base text-white font-mono">{printerToView.IPAddress ? printerToView.IPAddress : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* CUPS Printer Name */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Tên máy in CUPS</Label>
                <div className="text-base text-white font-mono">{printerToView.CUPSPrinterName ? printerToView.CUPSPrinterName : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Trạng thái</Label>
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      printerToView.Status === 'AVAILABLE' ? 'bg-green-900/30 text-green-400' :
                      printerToView.Status === 'BUSY' ? 'bg-yellow-900/30 text-yellow-400' :
                      printerToView.Status === 'OFFLINE' ? 'bg-gray-800 text-gray-400' :
                      printerToView.Status === 'MAINTENANCE' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-red-900/30 text-red-400'
                    }`}
                  >
                    {getStatusLabel(printerToView.Status)}
                  </span>
                </div>
              </div>

              {/* IsActive */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Trạng thái hoạt động</Label>
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      printerToView.IsActive
                        ? "bg-green-900/30 text-green-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {printerToView.IsActive ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </div>
              </div>

              {/* Building */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Tòa nhà (Building)</Label>
                <div className="text-base text-white">{(printerToView as any).Building ? (printerToView as any).Building : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* Room */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Phòng (Room)</Label>
                <div className="text-base text-white">{(printerToView as any).Room ? (printerToView as any).Room : <span className="text-gray-500">Không có</span>}</div>
              </div>

              {/* Printer ID */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">ID Máy in</Label>
                <div className="text-base text-white font-mono text-sm break-all">{printerToView.PrinterID}</div>
              </div>

              {/* Created At */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Ngày tạo</Label>
                <div className="text-base text-white">
                  {printerToView.CreatedAt ? new Date(printerToView.CreatedAt).toLocaleString('vi-VN') : <span className="text-gray-500">Không có</span>}
                </div>
              </div>

              {/* Updated At */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-400">Ngày cập nhật</Label>
                <div className="text-base text-white">
                  {printerToView.UpdatedAt ? new Date(printerToView.UpdatedAt).toLocaleString('vi-VN') : <span className="text-gray-500">Không có</span>}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailDialogOpen(false)} 
              className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a] hover:text-white"
            >
              Đóng
            </Button>
            {printerToView && (
              <Button 
                onClick={() => {
                  setIsDetailDialogOpen(false)
                  handleEditPrinter(printerToView)
                }} 
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

