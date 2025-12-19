import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, CreditCard, MapPin, Headphones } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <span className="text-sm font-bold text-black">⊜</span>
            </div>
            <span className="text-base font-semibold sm:text-lg">HCMSIU SSPS</span>
          </div>
          <nav className="hidden gap-6 md:flex md:gap-8">
            <Link href="#" className="text-sm text-gray-400 hover:text-white">
              Trang chủ
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-white">
              Giới thiệu
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-white">
              Bảng giá
            </Link>
          </nav>
          <Link href="/login">
            <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
        <div className="absolute inset-0 bg-gradient-radial from-gray-800/50 to-transparent" />
        <div className="absolute left-10 top-20 h-1 w-1 animate-pulse rounded-full bg-white" />
        <div className="absolute right-20 top-40 h-1 w-1 animate-pulse rounded-full bg-white delay-300" />
        <div className="absolute bottom-32 left-1/4 h-1 w-1 animate-pulse rounded-full bg-white delay-700" />
        <div className="absolute bottom-20 right-1/3 h-1 w-1 animate-pulse rounded-full bg-white delay-500" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm uppercase tracking-wide text-gray-400">HCMSIU SSPS</p>
          <h1 className="mb-6 text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            In ấn thông minh
            <br />
            Dành cho sinh viên
          </h1>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Bắt đầu in
              </Button>
            </Link>
            <Link href="/buy-pages">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                Mua trang
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 font-semibold">Upload siêu tốc</h3>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 font-semibold">Thanh toán SIUPay</h3>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 font-semibold">Bản đồ máy in</h3>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 font-semibold">Hỗ trợ 24/7</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div>
              <div className="mb-2 text-4xl font-bold sm:text-5xl">10.000+</div>
              <div className="text-gray-400">Sinh viên tin dùng</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold sm:text-5xl">50.000+</div>
              <div className="text-gray-400">Trang đã in</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold sm:text-5xl">50+</div>
              <div className="text-gray-400">Máy in hoạt động</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="overflow-hidden rounded-2xl">
              <img src="/3d-transparent-glass-art.jpg" alt="Gallery 1" className="h-full w-full object-cover" />
            </div>
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-2xl">
                <img src="/colorful-rainbow-hallway.jpg" alt="Gallery 2" className="h-full w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img src="/abstract-colorful-shapes.png" alt="Gallery 3" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl">
              <img src="/blue-watercolor-flowers.jpg" alt="Gallery 4" className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="mt-12 grid gap-8 sm:mt-20 md:grid-cols-3">
            <div>
              <h3 className="mb-3 text-xl font-semibold">Đăng nhập & Tải file.</h3>
              <p className="text-gray-400">
                Sử dụng tài khoản SSO của trường để đăng nhập và tải lên tài liệu cần in nhanh chóng.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-xl font-semibold">Chọn cấu hình in.</h3>
              <p className="text-gray-400">
                Tùy chỉnh khổ giấy, màu sắc, số lượng bản in và các tùy chọn in ấn khác theo nhu cầu.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-xl font-semibold">Thanh toán & nhận tài liệu.</h3>
              <p className="text-gray-400">
                Thanh toán dễ dàng qua SIUPay và nhận tài liệu in đẹp tại các điểm in trên campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 sm:py-32">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 px-8 py-16 text-center sm:px-12 sm:py-20">
          <div className="absolute left-10 top-10 h-20 w-20 rounded-full border border-gray-700 opacity-20" />
          <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full border border-gray-700 opacity-10" />

          <h2 className="relative mb-4 text-3xl font-bold sm:text-4xl">Bắt đầu in ngay hôm nay!</h2>
          <p className="relative mb-8 text-gray-400">Hiện đại hóa trải nghiệm in ấn cho sinh viên với SSPS.</p>
          <Link href="/login">
            <Button size="lg" className="relative bg-white text-black hover:bg-gray-100">
              Truy cập
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <h4 className="mb-4 font-semibold">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Trang chủ</li>
                <li>Tính năng</li>
                <li>Bảng giá</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Hướng dẫn sử dụng</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Cách in tài liệu</li>
                <li>Thanh toán</li>
                <li>Liên hệ</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Pháp lý</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>+1 (123) 456-7890</li>
                <li>+1 (123) 456-7891</li>
                <li>hello@hcmsiu.edu.vn</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400 sm:mt-12">
            © 2025 HCMSIU SSPS. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  )
}

