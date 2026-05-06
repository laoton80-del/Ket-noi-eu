# Project Context

## One-line Summary

**Kết Nối Global (ket-noi-global)** — ứng dụng **Expo / React Native** (iOS, Android, web) kèm **API Node/Express** (Prisma + PostgreSQL) cho phục vụ cộng đồng Việt ở châu Âu và du lịch: ví VIG, đặt dịch vụ / du lịch, AI hỗ trợ, B2B merchant, broker, từ thiện, giáo dục con em.

## Product Goal

- Cung cấp một “hệ sinh thái” tích hợp: **ví & thanh toán chuẩn hóa**, **tìm dịch vụ / travel**, **trợ lý giọng & AI**, **không gian B2B** (merchant), **broker attribution**, tuân thủ các luật nền tảng (Stripe, Apple/Google).
- Đồng bộ **ViGlobal** branding và các persona sản phẩm (Minh Khang, Leona, Lễ tân, Academy…) trong code và copy.

## Target Users

- **B2C:** Người Việt/expat tại EU — tiện ích đời sống, du lịch, học tập, ví credits (VIG).
- **B2B:** Merchant (salon, nhà hàng, hospitality…) — dashboard booking/ads (theo màn hình hiện có).
- **Broker:** Onboarding merchant + hoa hồng (route `/api/broker/*`).
- **Admin:** Thống kê tourism, marketing posts (route `/api/admin/*`).
- **Chưa xác định:** Tỷ lệ người dùng theo từng thị trường thực tế (cần dữ liệu sản phẩm / analytics).

## Core Features

| Lĩnh vực | Mô tả ngắn (từ codebase) |
|----------|--------------------------|
| Auth | Đăng nhập phone+PIN, email OTP (Zero-SMS), JWT (`src/routes/authRoutes.ts`, `AuthController`) |
| Ví & ledger | VIG, khóa số dư booking, chuyển P2P (`Wallet`, `Transaction`, `walletRoutes`) |
| Thanh toán | Stripe webhook (`/api/pay/webhook/stripe`), QR merchant, VietQR (`payRoutes`, `PaymentController`) |
| Booking | Booking legacy + hoàn tất qua QR (`bookingRoutes`) |
| Tourism | Discover, quote, book, wrap viral (`tourismRoutes`) |
| AI | Legal scan, dịch travel phrase, chat completion (`aiRoutes`) — có auth |
| Broker | Đăng business + commissions (`brokerRoutes` + `brokerMiddleware`) |
| Business | Ranking / trial SEO (`businessRoutes`) |
| Charity | Tổng quỹ (`charityRoutes`) |
| Education | Hoàn thành bài + piggy bank (`educationRoutes`) |
| GDPR | Xóa dữ liệu user (`userRoutes` POST `/gdpr/erase`) |
| Realtime | Socket.IO signaling trên cùng cổng API (`src/server.ts`) |
| Marketing cron | Auto poster (tuỳ env `MARKETING_AUTO_POSTER_ENABLED`) |

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Mobile / Web UI | Expo ~54, React Native 0.81, React 19, TypeScript |
| Điều hướng | React Navigation (native-stack + bottom-tabs) |
| State | Zustand, React Query (`@tanstack/react-query`), AsyncStorage |
| API server | Express 5, `tsx` chạy `src/server.ts` |
| ORM / DB | Prisma 6 + PostgreSQL (`DATABASE_URL`) |
| Auth API | JWT (`JWT_SECRET`), bcrypt cho PIN |
| Email OTP | AWS SES (`@aws-sdk/client-ses`) |
| Thanh toán | Stripe (`@stripe/stripe-react-native`), webhook HMAC |
| AI | OpenAI SDK (`openai`) |
| Observability | Pino (`src/utils/Logger.ts`), Sentry RN |
| Validation API | Zod + `validateBody` middleware |
| Khác | Socket.IO, Mapbox (`@rnmapbox/maps`), Firebase (App Check), PostHog |

## Current Status

- Monorepo-style: **Expo app** ở root + **API** trong `src/` (controllers, routes, services).
- **README** ở root: **không có** trong repo tại thời điểm quét — dự án dựa vào script `package.json`, `app.config.js`, Prisma, và docs trong `docs/`.
- **Firebase Cloud Functions:** thư mục `functions/` tồn tại (script `functions:build`); chi tiết triển khai: xem `docs/FUNCTIONS_BUNDLE_PARITY.md` nếu cần.
- **Supabase:** có migration SQL trong `supabase/` và `supabase_migrations/` — có thể dùng song song Prisma; **Chưa xác định** môi trường production chỉ dùng một hay kết hợp.

## Important Business Rules

- **VIG / EUR:** Schema và comment business rules nhấn mạnh ledger EUR-pegged và fee tourism (ví dụ `TourismBooking`: phí provider/tourist). Chi tiết % áp dụng theo service layer (`StripeBillingService`, `TourismHubService`) — không copy số cố định vào doc này mà đọc code khi sửa tiền.
- **GDPR:** Endpoint erase có điều kiện (ví dụ không xóa admin, merchant phải offboard business trước) — xem `UserService.wipeUserData`.
- **B2B phone policy:** Client có `b2bMerchantPhonePolicy` (+84 diaspora rules); backend broker flow cần đọc kỹ trước khi thay đổi role.
- **Stripe webhook:** Raw body + signature verification; route mounted trước JSON parser (`src/app.ts`).

## Non-goals

- Tài liệu này **không** thay thế hợp đồng pháp lý, privacy policy, hay đánh giá bảo mật forman.
- **Không** cam kết roadmap sản phẩm — xem `ROADMAP.md` và `docs/ROADMAP_V9_CHECKLIST.md`.

## Known Constraints

- Biến môi trường bắt buộc API: `DATABASE_URL`, `JWT_SECRET` (tối thiểu 16 ký tự), SES cho OTP — xem `.env.example`.
- Rate limit IP trên API (`pathAwareApiRateLimiter`); webhook Stripe được bypass.
- Build iOS/Android cần file Google Services (`GOOGLE_SERVICE_INFO_PLIST`, `GOOGLE_SERVICES_JSON`) theo `app.config.js`.

## Glossary

| Thuật ngữ | Ý nghĩa trong repo |
|-----------|-------------------|
| **VIG** | Đơn vị credits trong ví (`balanceVIG`), gắn với pricing EUR trong schema/comment |
| **ViGlobal / KNG** | Tên thương hiệu / nền tảng trong copy và config |
| **Zero-SMS** | Luồng xác thực qua email OTP thay SMS (model `EmailOtpChallenge`) |
| **Persona** | EXPAT vs TOURIST + routing UI (`User.persona`) |
| **Broker / Mica** | QR attribution merchant — `Business.brokerId`, escrow broker |
