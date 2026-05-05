# Architecture

## High-level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Expo App (React Native + Web)                              │
│  App.tsx → Navigation → screens → services / state          │
│  EXPO_PUBLIC_* / extra (env.ts) → API base URL, keys        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / WS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API (createApp) — src/app.ts                       │
│  Middleware: CORS, JSON, pathAwareApiRateLimiter            │
│  Routes: /api/auth, /api/wallet, …                          │
│  Stripe webhook: POST /api/pay/webhook/stripe (raw body)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     PostgreSQL      AWS SES          Stripe / OpenAI
     (Prisma)        (OTP email)      (webhook + client)
```

- **Socket.IO** gắn trên cùng HTTP server trong `src/server.ts` (`attachSignalingServer`) — WebRTC signaling.
- **Cron nhẹ:** `startMarketingAutoPoster` khi server khởi động (nếu không tắt bằng env).

## Folder Structure

| Path | Vai trò |
|------|---------|
| `App.tsx`, `index.ts` | Entry Expo |
| `src/screens/` | Màn hình theo domain (b2b, b2c, admin, …) |
| `src/navigation/` | Định tuyến, tab, blueprint V7 |
| `src/components/` | UI tái sử dụng |
| `src/services/` | Logic client + một phần logic domain gọi API |
| `src/controllers/` | HTTP handlers Express |
| `src/routes/` | Đăng ký route Express |
| `src/middleware/` | auth, rate limit, validate body, broker, admin |
| `src/services/api/` & `src/services/` (server) | Service layer dùng Prisma |
| `src/lib/prisma.ts` | Client Prisma singleton |
| `prisma/schema.prisma` | Schema DB |
| `prisma/migrations/` | Migration SQL |
| `functions/` | Firebase Cloud Functions (build riêng) |
| `supabase/`, `supabase_migrations/` | SQL bổ sung (RLS, wallet P2P…) |
| `scripts/` | Preflight, smoke, kiểm tra commercial |

## Main Modules

| Module | Trách nhiệm |
|--------|-------------|
| `src/app.ts` | Compose Express: webhook Stripe, JSON, rate limit, mount routers, 404, error handler |
| `src/server.ts` | HTTP server, Socket.IO, marketing poster, graceful shutdown |
| `controllers/*` | Parse request, gọi service, trả `jsonOk` / `jsonFail` (`utils/apiEnvelope.ts`) |
| `services/api/*`, `services/*` | Nghiệp vụ: Auth, Wallet, Booking, Tourism, Stripe webhook, … |
| `middleware/authMiddleware.ts` | JWT Bearer → `req.authUserId` |
| `middleware/brokerMiddleware.ts` | Chỉ user có role Broker |
| `middleware/superAdminMiddleware.ts` | Admin routes |
| Client `services/` | API client, wallet sync, AI, travel, B2B mocks một phần |

## Data Flow

1. **App → API:** HTTP JSON; envelope `{ success: true, data }` / `{ success: false, error }`.
2. **Auth:** `POST /api/auth/login` hoặc OTP email → JWT; client gửi `Authorization: Bearer <token>` cho route có `authMiddleware`.
3. **Stripe:** Client không được tin “thanh toán thành công” — server chỉ cấp VIG sau `payment_intent.succeeded` qua webhook (`StripeWebhookService`).
4. **Prisma:** Mọi truy cập DB đi qua `getPrisma()` trong service/controller.

## State Management

- **Client:** Zustand stores (ví dụ `src/state/`), React Query cho fetch; AsyncStorage cho auth local / cờ pilot.
- **Server:** Stateless JWT; session refresh qua model `AuthRefreshSession` (schema) — **Chưa xác định** mức độ đã nối hết vào client (cần đọc `AuthService` / login response).

## API Layer

- Routers trong `src/routes/*.ts` → Controllers.
- Validation: Zod schema trong `src/validation/`, `validateBody` trên auth routes.
- Rate limiting: `RateLimitMiddleware.ts` — AI routes stricter; Stripe webhook excluded.

## Database Layer

- **Nguồn sự thật schema:** `prisma/schema.prisma`.
- **PostgreSQL** qua `DATABASE_URL`.
- **Bổ sung:** file SQL Supabase có thể không được Prisma migrate tự áp — kiểm tra khi deploy.

## Auth / Permission Model

| Cơ chế | Chi tiết |
|--------|----------|
| JWT | `sub` = user id; secret `JWT_SECRET` |
| Route bảo vệ | `authMiddleware` trên hầu hết `/api/*` trừ auth, charity totals, tourism discover, health, stripe webhook |
| Broker | `authMiddleware` + `brokerMiddleware` |
| Super admin | `authMiddleware` + `superAdminMiddleware` |
| Role | Enum Prisma `Role`: B2C, B2B, B2B_EU, B2B_VN, ADMIN, BROKER |

## External Services

- **Stripe:** PaymentIntent, webhook signing secret (`STRIPE_WEBHOOK_SECRET` — **không** ghi trong doc giá trị).
- **AWS SES:** Gửi OTP email.
- **OpenAI:** AI routes (keys qua env server — tên biến xem `.env` local, không commit).
- **Mapbox:** Token public qua `extra` trong `app.config.js`.
- **Sentry / PostHog / Firebase:** theo package và config native.

## Error Handling

- API: `jsonFail(message, statusCode)`; lỗi không bắt trong controller → middleware cuối `app.ts` log + 500.
- Logger: Pino (`logger.error({ err }, …)`).

## Logging / Monitoring

- **Pino** structured logs (`src/utils/Logger.ts`).
- **Sentry** RN SDK trong dependencies — cấu hình chi tiết: **Chưa xác định** trong một file duy nhất (tìm `Sentry.init`).

## Performance Considerations

- Translation cache (`TranslationCache`) giảm gọi OpenAI lặp.
- Rate limits AI và wallet transfer.
- Prisma transaction isolation cho một số thao tác ví / Stripe.

## Architecture Decisions

- Webhook Stripe **trước** body parser JSON để giữ raw body cho signature.
- Envelope API nhất quán (`ApiSuccess` / `ApiFailure`).
- Persona / hub theme tách file config (`src/config/`, `navigation`).

## Things Not To Change Without Review

- Thứ tự middleware trong `app.ts` (webhook + rate limit).
- Contract envelope JSON (`success`, `data` | `error`).
- Prisma relations và cascade delete — ảnh hưởng GDPR và ví.
- Stripe webhook fulfillment và idempotency `ProcessedStripeEvent`.
- `GLOBAL_SETTLEMENT_CURRENCY` / quy tắc EUR trong `constants/V7FinancialRules.ts` khi đụng thanh toán.
