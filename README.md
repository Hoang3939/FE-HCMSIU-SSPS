# FE-HCMSIU-SSPS

Frontend cho hệ thống **Smart Student Printing Service (SSPS)** tại HCMIU.

- **Framework:** Next.js (App Router) + React + TypeScript
- **UI:** Tailwind CSS + Radix UI + custom components
- **State:** Zustand
- **API:** kết nối backend qua `lib/api/*`

---

## 1) Cấu trúc dự án

```text
FE-HCMSIU-SSPS/
├─ app/                        # routes/pages (App Router)
│  ├─ admin/                   # giao diện admin
│  ├─ api/auth/                # API routes frontend (login/logout)
│  ├─ login, dashboard, print, upload, history, ...
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ admin/
│  ├─ auth/
│  ├─ shared/
│  ├─ student/
│  └─ ui/
├─ hooks/
├─ lib/
│  ├─ api/                     # api client và service wrappers
│  ├─ stores/                  # Zustand stores
│  ├─ types/
│  └─ utils/
├─ public/
├─ package.json
├─ next.config.mjs
├─ tsconfig.json
└─ README.md
```

---

## 2) Yêu cầu môi trường

- Node.js 18+
- npm 9+

---

## 3) Cài đặt

```bash
npm install
```

---

## 4) Cấu hình môi trường

Tạo file `.env.local` (tuỳ theo cách cấu hình API của team), ví dụ:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Nếu dự án đang dùng file cấu hình riêng trong `lib/api-config.ts`, hãy đồng bộ giá trị base URL với backend BE.

---

## 5) Chạy dự án

### Development

```bash
npm run dev
```

App mặc định chạy tại:

```text
http://localhost:3000
```

### Build + Production

```bash
npm run build
npm run start
```

---

## 6) Scripts chính

- `npm run dev`: chạy dev server
- `npm run build`: build production
- `npm run start`: chạy bản build
- `npm run lint`: lint code

---

## 7) Module chính

### Student
- Đăng nhập/đăng xuất
- Dashboard người dùng
- Upload tài liệu, in ấn, lịch sử
- Chọn máy in và mua trang in

### Admin
- Dashboard quản trị
- Quản lý printers
- Quản lý students
- Báo cáo, cấu hình hệ thống

---

## 8) Ghi chú vận hành

- Không commit secret hoặc `.env.local` thật.
- Đồng bộ version API contract giữa FE và BE trước khi release.
- Kiểm tra flow auth khi đổi endpoint backend.

