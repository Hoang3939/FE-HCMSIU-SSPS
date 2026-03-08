"use client"

import { useState, useEffect } from "react"
import { getUserBalance, getTransactionHistory, getPrintHistory } from "@/lib/api"
import { Header } from "@/components/shared/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, CreditCard, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"

interface TransactionItem {
  transID: string
  date: string
  amount: number
  pagesAdded: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  paymentMethod: string | null
  paymentRef: string | null
}

interface PrintItem {
  jobID: string
  date: string
  documentName: string
  printerName: string
  pagesUsed: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  cost: number
}

export default function HistoryPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [prints, setPrints] = useState<PrintItem[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [loadingPrints, setLoadingPrints] = useState(false)
  const [activeTab, setActiveTab] = useState("transactions")
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const { user, accessToken, isAuthenticated } = useAuthStore()

  // Wait for auth store to hydrate from localStorage
  useEffect(() => {
    // Zustand persist middleware hydrates asynchronously
    // Wait a bit for it to complete
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Check auth - redirect to login if no user
  useEffect(() => {
    if (!isHydrated) return

    // If no user at all, redirect to login
    if (!user) {
      router.push('/login')
      return
    }
  }, [isHydrated, user, router])

  useEffect(() => {
    if (!isHydrated || !user) return

    const loadBalance = async () => {
      try {
        const balanceData = await getUserBalance()
        setBalance(balanceData.balancePages)
      } catch (error) {
        console.error('Error loading balance:', error)
      }
    }
    loadBalance()
  }, [isHydrated, user])

  useEffect(() => {
    if (!isHydrated || !user) return

    // Don't check accessToken - let interceptor handle refresh if needed
    if (activeTab === "transactions") {
      loadTransactions()
    } else {
      loadPrints()
    }
  }, [activeTab, isHydrated, user])

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const response = await getTransactionHistory()
      setTransactions(response.data || [])
    } catch (error: any) {
      console.error('Error loading transactions:', error)
      if (error.message?.includes('đăng nhập')) {
        toast.error(error.message)
        router.push('/login')
      } else {
        toast.error('Không thể tải lịch sử giao dịch')
      }
    } finally {
      setLoadingTransactions(false)
    }
  }

  const loadPrints = async () => {
    try {
      setLoadingPrints(true)
      const response = await getPrintHistory()
      setPrints(response.data || [])
    } catch (error: any) {
      console.error('Error loading prints:', error)
      if (error.message?.includes('đăng nhập')) {
        toast.error(error.message)
        router.push('/login')
      } else {
        toast.error('Không thể tải lịch sử in ấn')
      }
    } finally {
      setLoadingPrints(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string, type: 'transaction' | 'print') => {
    const baseClasses = "inline-flex rounded-full px-3 py-1 text-xs font-medium"
    
    if (type === 'transaction') {
      switch (status) {
        case 'COMPLETED':
          return `${baseClasses} bg-green-50 text-green-600`
        case 'PENDING':
          return `${baseClasses} bg-yellow-50 text-yellow-600`
        case 'FAILED':
          return `${baseClasses} bg-red-50 text-red-600`
        case 'REFUNDED':
          return `${baseClasses} bg-gray-50 text-gray-600`
        default:
          return `${baseClasses} bg-gray-50 text-gray-600`
      }
    } else {
      switch (status) {
        case 'COMPLETED':
          return `${baseClasses} bg-green-50 text-green-600`
        case 'PROCESSING':
          return `${baseClasses} bg-blue-50 text-blue-600`
        case 'PENDING':
          return `${baseClasses} bg-yellow-50 text-yellow-600`
        case 'FAILED':
          return `${baseClasses} bg-red-50 text-red-600`
        case 'CANCELLED':
          return `${baseClasses} bg-gray-50 text-gray-600`
        default:
          return `${baseClasses} bg-gray-50 text-gray-600`
      }
    }
  }

  const getStatusText = (status: string, type: 'transaction' | 'print') => {
    if (type === 'transaction') {
      switch (status) {
        case 'COMPLETED':
          return 'Thành công'
        case 'PENDING':
          return 'Đang xử lý'
        case 'FAILED':
          return 'Thất bại'
        case 'REFUNDED':
          return 'Đã hoàn tiền'
        default:
          return status
      }
    } else {
      switch (status) {
        case 'COMPLETED':
          return 'Hoàn thành'
        case 'PROCESSING':
          return 'Đang xử lý'
        case 'PENDING':
          return 'Chờ xử lý'
        case 'FAILED':
          return 'Thất bại'
        case 'CANCELLED':
          return 'Đã hủy'
        default:
          return status
      }
    }
  }

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Show loading if not authenticated (will redirect to login)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole={user.role.toLowerCase() as "student" | "spso"} balance={balance} userName={user.username} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Lịch sử</h1>
          <p className="text-gray-600">Xem lại lịch sử giao dịch và in ấn của bạn</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">
              <CreditCard className="mr-2 h-4 w-4" />
              Lịch sử Giao dịch
            </TabsTrigger>
            <TabsTrigger value="prints">
              <FileText className="mr-2 h-4 w-4" />
              Lịch sử In ấn
            </TabsTrigger>
          </TabsList>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử Giao dịch</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">Đang tải...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    Chưa có giao dịch nào
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-indigo-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Thời gian</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Mã giao dịch</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Số tiền</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Số trang cộng thêm</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((transaction) => (
                          <tr key={transaction.transID} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                              {formatDateTime(transaction.date)}
                            </td>
                            <td className="px-4 py-4 text-sm font-mono text-gray-900 sm:px-6">
                              {transaction.transID.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                              {transaction.pagesAdded} trang
                            </td>
                            <td className="px-4 py-4 sm:px-6">
                              <span className={getStatusBadge(transaction.status, 'transaction')}>
                                {getStatusText(transaction.status, 'transaction')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Print History Tab */}
          <TabsContent value="prints" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử In ấn</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPrints ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">Đang tải...</span>
                  </div>
                ) : prints.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    Chưa có lệnh in nào
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-indigo-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Thời gian</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Tên tài liệu</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Máy in</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Số trang bị trừ</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {prints.map((print) => (
                          <tr key={print.jobID} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                              {formatDateTime(print.date)}
                            </td>
                            <td className="px-4 py-4 text-sm sm:px-6">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                {print.documentName}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                              {print.printerName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 sm:px-6">
                              {print.pagesUsed} trang
                            </td>
                            <td className="px-4 py-4 sm:px-6">
                              <span className={getStatusBadge(print.status, 'print')}>
                                {getStatusText(print.status, 'print')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}