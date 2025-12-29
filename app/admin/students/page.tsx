"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Pencil, Lock, Eye, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { getAllUsers, createUser, updateUser, deleteUser, type UserDTO, type CreateUserDTO, type UpdateUserDTO } from "@/lib/api/user-api"
import { toast } from "sonner"

export default function StudentsManagementPage() {
  const [users, setUsers] = useState<UserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  // Form cho tạo mới
  const createForm = useForm<CreateUserDTO>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "STUDENT",
      isActive: true,
    },
    mode: "onChange",
  })

  // Form cho chỉnh sửa
  const editForm = useForm<UpdateUserDTO>({
    defaultValues: {
      username: "",
      email: "",
      role: "STUDENT",
      isActive: true,
    },
  })

  // Fetch users từ API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast.error("Không thể tải danh sách người dùng", {
        description: error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Xử lý tạo mới user
  const handleCreateUser = async (data: CreateUserDTO) => {
    // Validation
    if (!data.username || !data.email || !data.password || !data.role) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }
    if (data.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(data.email)) {
      toast.error("Email không hợp lệ")
      return
    }

    try {
      setIsSubmitting(true)
      await createUser(data)
      toast.success("Tạo người dùng thành công")
      setIsCreateDialogOpen(false)
      createForm.reset()
      fetchUsers()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast.error("Không thể tạo người dùng", {
        description: error.response?.data?.message || error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xử lý chỉnh sửa user
  const handleEditUser = async (data: UpdateUserDTO) => {
    if (!selectedUser) return

    // Validation
    if (!data.username || !data.email || !data.role) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }
    if (data.password && data.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(data.email)) {
      toast.error("Email không hợp lệ")
      return
    }

    // Nếu không có password mới, không gửi field password
    const updateData: UpdateUserDTO = {
      username: data.username,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
    }
    if (data.password && data.password.trim() !== "") {
      updateData.password = data.password
    }

    try {
      setIsSubmitting(true)
      await updateUser(selectedUser.id, updateData)
      toast.success("Cập nhật người dùng thành công")
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      editForm.reset()
      fetchUsers()
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast.error("Không thể cập nhật người dùng", {
        description: error.response?.data?.message || error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xử lý khóa tài khoản user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      await deleteUser(selectedUser.id)
      toast.success("Khóa tài khoản thành công")
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error("Error locking user:", error)
      toast.error("Không thể khóa tài khoản", {
        description: error.response?.data?.message || error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mở dialog chỉnh sửa
  const openEditDialog = (user: UserDTO) => {
    setSelectedUser(user)
    editForm.reset({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  // Mở dialog xóa
  const openDeleteDialog = (user: UserDTO) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Lọc users theo search query
  const filteredUsers = users.filter(
    (user) =>
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = users.filter(u => !u.isActive).length

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)
  const startRecord = filteredUsers.length > 0 ? startIndex + 1 : 0
  const endRecord = Math.min(endIndex, filteredUsers.length)

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-6 bg-[#121212] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Quản lý người dùng</h1>
        <p className="text-gray-400">Quản lý thông tin người dùng trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tổng số người dùng</p>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-[#4D47C3]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-400">{activeUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Không hoạt động</p>
                <p className="text-2xl font-bold text-gray-400">{inactiveUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add Button */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo ID, tên đăng nhập, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                />
              </div>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-9 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-[#3a3a3a]"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-xl">Danh sách người dùng ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-gray-400 mt-1">
            Tổng số người dùng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Đang tải...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a2a] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tên đăng nhập</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Vai trò</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Số dư trang</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        {users.length === 0 ? "Chưa có người dùng nào" : "Không tìm thấy người dùng"}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const globalIndex = startIndex + index
                      return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-[#252525] transition-colors ${!user.isActive ? "opacity-50" : ""}`}
                        style={{
                          backgroundColor: globalIndex % 2 === 0 ? '#1E1E1E' : '#252525'
                        }}
                      >
                        <td className="px-4 py-4 text-sm font-medium text-white sm:px-6">{user.id}</td>
                        <td className="px-4 py-4 text-sm text-gray-300 sm:px-6">{user.username}</td>
                        <td className="px-4 py-4 text-sm text-gray-400 sm:px-6">{user.email}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge variant="outline" className="border-[#3a3a3a] text-gray-300 bg-[#2a2a2a]">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge
                            className={
                              (user.balancePages || 0) > 0
                                ? "bg-green-900/30 text-green-400 rounded-full px-3 py-1"
                                : "bg-red-900/30 text-red-400 rounded-full px-3 py-1"
                            }
                          >
                            {user.balancePages || 0} trang
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge
                            className={
                              user.isActive
                                ? "bg-green-900/30 text-green-400 rounded-full px-3 py-1"
                                : "bg-gray-800 text-gray-400 rounded-full px-3 py-1"
                            }
                          >
                            {user.isActive ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              className="text-gray-300 hover:text-white hover:bg-[#3a3a3a] h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {user.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                                className="text-gray-300 hover:text-amber-400 hover:bg-[#3a3a3a] h-8 w-8 p-0"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredUsers.length > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-[#2a2a2a] px-4 py-4 sm:flex-row sm:px-6">
              <div className="text-sm text-gray-400">
                Hiển thị {startRecord}-{endRecord} trong tổng số {filteredUsers.length} người dùng
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="border-[#3a3a3a] bg-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageClick(page)}
                        className={`min-w-[40px] ${
                          currentPage === page
                            ? "bg-[#4D47C3] border-[#4D47C3] text-white hover:bg-[#3d37a3]"
                            : "border-[#3a3a3a] bg-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="border-[#3a3a3a] bg-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
            <DialogTitle className="text-white">Thêm người dùng mới</DialogTitle>
              <DialogDescription className="text-gray-400">
              Điền thông tin để tạo người dùng mới trong hệ thống
              </DialogDescription>
            </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateUser)}>
              <div className="grid gap-4 py-4">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nhập tên đăng nhập" 
                          className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          placeholder="email@example.com" 
                          className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Mật khẩu</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          placeholder="Nhập mật khẩu" 
                          className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Vai trò</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-white focus:ring-[#4a4a4a]">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                          <SelectItem value="STUDENT">Sinh viên</SelectItem>
                          <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                          <SelectItem value="SPSO">SPSO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="space-y-2 flex items-center gap-2 pt-2">
                      <FormControl>
                        <Switch
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#3a82f6] data-[state=checked]:border-[#3a82f6]"
                        />
                      </FormControl>
                      <FormLabel htmlFor="isActive" className="cursor-pointer text-gray-300 !mt-0">
                        Trạng thái hoạt động
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    createForm.reset()
                  }}
                  disabled={isSubmitting}
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a] hover:text-white"
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo mới"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription className="text-gray-400">
              Cập nhật thông tin người dùng
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)}>
              <div className="grid gap-4 py-4">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nhập tên đăng nhập" 
                          className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          placeholder="email@example.com" 
                          className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Mật khẩu mới (để trống nếu không đổi)</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          placeholder="Nhập mật khẩu mới" 
                          className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus-visible:ring-[#4a4a4a]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Vai trò</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-white focus:ring-[#4a4a4a]">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                          <SelectItem value="STUDENT">Sinh viên</SelectItem>
                          <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                          <SelectItem value="SPSO">SPSO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="space-y-2 flex items-center gap-2 pt-2">
                      <FormControl>
                        <Switch
                          id="isActive-edit"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#3a82f6] data-[state=checked]:border-[#3a82f6]"
                        />
                      </FormControl>
                      <FormLabel htmlFor="isActive-edit" className="cursor-pointer text-gray-300 !mt-0">
                        Trạng thái hoạt động
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedUser(null)
                    editForm.reset()
                  }}
                  disabled={isSubmitting}
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a] hover:text-white"
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </DialogContent>
        </Dialog>

      {/* Lock User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(false)}
            className="absolute right-4 top-4 h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a] z-10"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
          <AlertDialogHeader className="pr-8">
            <AlertDialogTitle className="text-white">Khóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Người dùng <strong className="text-white">{selectedUser?.username}</strong> ({selectedUser?.email}) sẽ bị vô hiệu hóa và không thể đăng nhập vào hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isSubmitting} 
              className="border-[#3a3a3a] bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] hover:text-white"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border-amber-900/50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang khóa...
                </>
              ) : (
                "Khóa tài khoản"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
