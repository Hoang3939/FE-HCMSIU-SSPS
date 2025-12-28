"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { createPayment, checkPaymentStatus } from "@/lib/api"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTier: {
    pages: number
    price: number
    pricePerPage: number
  } | null
  onPaymentSuccess: (pages: number) => void
}

interface TransactionInfo {
  transactionId: string
  amount: number
  pages: number
  status: "pending" | "success" | "failed"
  createdAt: string
  qrUrl: string
}

export function PaymentDialog({
  open,
  onOpenChange,
  selectedTier,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Create transaction when dialog opens and tier is selected
  useEffect(() => {
    if (open && selectedTier && !transaction) {
      createTransaction()
    }
    if (!open) {
      // Reset when dialog closes
      setTransaction(null)
      setIsChecking(false)
      setIsCreating(false)
    }
  }, [open, selectedTier])

  const createTransaction = async () => {
    if (!selectedTier) return

    setIsCreating(true)
    try {
      const result = await createPayment({
        amount: selectedTier.price,
        pageQuantity: selectedTier.pages,
      })

      const now = new Date()
      const newTransaction: TransactionInfo = {
        transactionId: result.transId,
        amount: selectedTier.price,
        pages: selectedTier.pages,
        status: "pending",
        createdAt: now.toLocaleString("vi-VN"),
        qrUrl: result.qrUrl,
      }

      setTransaction(newTransaction)
    } catch (error) {
      console.error("Error creating payment:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tạo giao dịch thanh toán. Vui lòng thử lại."
      )
      onOpenChange(false)
    } finally {
      setIsCreating(false)
    }
  }

  const copyTransactionId = () => {
    if (transaction) {
      navigator.clipboard.writeText(transaction.transactionId)
      toast.success("Đã sao chép mã giao dịch")
    }
  }

  const checkTransactionStatus = async () => {
    if (!transaction) return

    setIsChecking(true)
    try {
      console.log('[PaymentDialog] Checking status for transaction:', transaction.transactionId)
      const result = await checkPaymentStatus(transaction.transactionId)
      console.log('[PaymentDialog] Status check result:', result)

      if (result.status === "COMPLETED") {
        console.log('[PaymentDialog] Transaction completed!')
        setTransaction((prev) =>
          prev
            ? {
                ...prev,
                status: "success",
              }
            : null
        )
        toast.success("Giao dịch thành công! Trang in đã được cộng vào tài khoản.")
        onPaymentSuccess(result.pages)
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          onOpenChange(false)
        }, 2000)
      } else {
        // Still pending
        console.log('[PaymentDialog] Transaction still pending, status:', result.status)
        toast.info("Giao dịch đang được xử lý. Vui lòng thử lại sau.")
      }
    } catch (error) {
      console.error("[PaymentDialog] Error checking payment status:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể kiểm tra trạng thái giao dịch. Vui lòng thử lại."
      )
    } finally {
      setIsChecking(false)
    }
  }

  if (!selectedTier || !transaction) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán qua QR Code</DialogTitle>
          <DialogDescription>
            Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để thanh toán
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mã giao dịch:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {transaction.transactionId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTransactionId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số trang:</span>
                  <span className="font-semibold">{transaction.pages} trang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số tiền:</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {transaction.amount.toLocaleString()} ₫
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Thời gian:</span>
                  <span>{transaction.createdAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="flex justify-center">
            <Card className="p-4">
              <CardContent className="p-0">
                {isCreating ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-center text-sm text-gray-600">
                      Đang tạo giao dịch...
                    </p>
                  </div>
                ) : transaction.status === "pending" ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-lg bg-white p-4">
                      <img
                        src={transaction.qrUrl}
                        alt="QR Code thanh toán"
                        className="h-[280px] w-[280px]"
                      />
                    </div>
                    <p className="text-center text-xs text-gray-500">
                      Quét mã QR để thanh toán
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="h-32 w-32 text-green-500" />
                    <p className="text-center font-semibold text-green-600">
                      Thanh toán thành công!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status and Actions */}
          <div className="space-y-2">
            {transaction.status === "pending" && (
              <>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang chờ thanh toán...</span>
                </div>
                <Button
                  onClick={checkTransactionStatus}
                  disabled={isChecking}
                  className="w-full"
                  variant="outline"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Kiểm tra kết quả giao dịch
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Sau khi thanh toán, nhấn nút trên để kiểm tra kết quả
                </p>
              </>
            )}

            {transaction.status === "success" && (
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="font-semibold text-green-700">
                  +{transaction.pages} trang đã được cộng vào tài khoản
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

