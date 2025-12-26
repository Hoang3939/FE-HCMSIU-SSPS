"use client"

import { useState, useEffect } from "react"
import { getUserBalance } from "@/lib/api"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Sparkles } from "lucide-react"

interface PricingTier {
  pages: number
  price: number
  pricePerPage: number
  popular?: boolean
}

export default function BuyPagesPage() {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [currentBalance, setCurrentBalance] = useState(0)

  const pricingTiers: PricingTier[] = [
    { pages: 10, price: 5000, pricePerPage: 500 },
    { pages: 50, price: 20000, pricePerPage: 400, popular: true },
    { pages: 100, price: 35000, pricePerPage: 350 },
    { pages: 200, price: 60000, pricePerPage: 300 },
  ]

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balanceData = await getUserBalance()
        setCurrentBalance(balanceData.balancePages)
      } catch (error) {
        console.error('Error loading balance:', error)
      }
    }
    loadBalance()
  }, [])

  const handlePayment = () => {
    if (selectedTier) {
      // In real app, this would redirect to SIUPay payment gateway
      console.log("Redirecting to SIUPay for:", selectedTier)
      // Simulate payment redirect
      alert(`Chuyển hướng đến SIUPay để thanh toán ${selectedTier.price.toLocaleString()} ₫`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={currentBalance} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Mua trang in</h1>
          <p className="text-gray-600">
            Số trang hiện tại: <span className="font-semibold text-indigo-600">{currentBalance} trang</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mb-8 grid gap-4 sm:mb-12 sm:grid-cols-2 lg:grid-cols-4">
          {pricingTiers.map((tier) => (
            <button
              key={tier.pages}
              onClick={() => setSelectedTier(tier)}
              className={`relative rounded-3xl border-2 p-6 text-center transition-all hover:shadow-lg sm:p-8 ${
                selectedTier?.pages === tier.pages
                  ? "border-indigo-600 bg-indigo-50 shadow-lg"
                  : "border-gray-200 bg-white"
              }`}
            >
              {tier.popular && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white sm:px-4">
                    <Sparkles className="h-3 w-3" />
                    Phổ biến
                  </div>
                </div>
              )}

              <div className="mb-4 text-4xl font-bold text-indigo-600 sm:text-5xl">{tier.pages}</div>
              <div className="mb-2 text-sm text-gray-600">Trang in</div>
              <div className="mb-1 text-2xl font-bold sm:text-3xl">{tier.price.toLocaleString()} ₫</div>
              <div className="text-sm text-gray-500">{tier.pricePerPage} ₫/trang</div>
            </button>
          ))}
        </div>

        {/* Payment Section */}
        {selectedTier && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <CardTitle>Thanh toán qua SIUPay</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gói đã chọn:</span>
                <span className="font-medium">{selectedTier.pages} trang</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="font-semibold">Tổng thanh toán:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {selectedTier.price.toLocaleString()} ₫
                </span>
              </div>
              <Button
                onClick={handlePayment}
                className="mt-6 w-full bg-indigo-600 py-6 text-lg hover:bg-indigo-700"
              >
                Thanh toán qua SIUPay
              </Button>
              <p className="text-center text-xs text-gray-500">Giao dịch được bảo mật bởi SIUPay Gateway</p>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Thông tin thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Thanh toán được xử lý qua hệ thống SIUPay của trường</p>
            <p>• Trang in sẽ được cộng vào tài khoản ngay sau khi thanh toán thành công</p>
            <p>• 1 trang A3 tương đương 2 trang A4</p>
            <p>• Trang in không có thời hạn sử dụng</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

