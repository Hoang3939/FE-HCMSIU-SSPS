"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Pencil, Lock, Eye, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  return (
    <div className="p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
          <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Quản lý người dùng</h1>
          <p className="mt-2 text-gray-600">Quản lý thông tin người dùng trong hệ thống</p>
          </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
              placeholder="Tìm kiếm theo ID, tên đăng nhập, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

      {/* Users List */}
        <Card>
          <CardHeader>
          <CardTitle>Danh sách người dùng ({filteredUsers.length})</CardTitle>
          <CardDescription>Tổng số người dùng trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-600 text-white">
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
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {users.length === 0 ? "Chưa có người dùng nào" : "Không tìm thấy người dùng"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-50 ${!user.isActive ? "opacity-50 bg-gray-50" : ""}`}
                      >
                        <td className="px-4 py-4 text-sm font-medium sm:px-6">{user.id}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">{user.username}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">{user.email}</td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge variant="outline">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge
                            className={
                              (user.balancePages || 0) > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {user.balancePages || 0} trang
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <Badge
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {user.isActive ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          {user.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

            {/* Pagination */}
          {!loading && filteredUsers.length > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-6">
                <div className="text-sm text-gray-500">
                Hiển thị 1-{filteredUsers.length} trong tổng số {filteredUsers.length} người dùng
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
              <DialogDescription>
              Điền thông tin để tạo người dùng mới trong hệ thống
              </DialogDescription>
            </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên đăng nhập</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập tên đăng nhập" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="Nhập mật khẩu" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vai trò</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STUDENT">Sinh viên</SelectItem>
                        <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                        <SelectItem value="SPSO">SPSO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Trạng thái hoạt động</FormLabel>
                              <div className="text-sm text-gray-500">
                        Cho phép người dùng đăng nhập vào hệ thống
                              </div>
                            </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    createForm.reset()
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo mới"
                  )}
                </Button>
                        </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người dùng
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên đăng nhập</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập tên đăng nhập" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới (để trống nếu không đổi)</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="Nhập mật khẩu mới" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vai trò</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STUDENT">Sinh viên</SelectItem>
                        <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                        <SelectItem value="SPSO">SPSO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Trạng thái hoạt động</FormLabel>
                      <div className="text-sm text-gray-500">
                        Cho phép người dùng đăng nhập vào hệ thống
                  </div>
                </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedUser(null)
                    editForm.reset()
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật"
                  )}
                    </Button>
              </div>
            </form>
          </Form>
          </DialogContent>
        </Dialog>

      {/* Lock User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              Người dùng <strong>{selectedUser?.username}</strong> ({selectedUser?.email}) sẽ bị vô hiệu hóa và không thể đăng nhập vào hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
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
