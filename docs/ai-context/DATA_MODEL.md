# Data Model

## Overview

- **ORM:** Prisma 6  
- **Database:** PostgreSQL (`DATABASE_URL`)  
- **Schema file:** `prisma/schema.prisma`  
- **Bổ sung:** Một số bảng / function có thể đến từ SQL thủ công trong `supabase_migrations/` hoặc `supabase/migrations/` (ví dụ P2P VIG) — **Chưa xác định** 100% đã `prisma db pull` đồng bộ.

## Entities (Prisma models — tóm tắt)

| Model | Mục đích |
|-------|----------|
| `User` | Người dùng: phone, PIN hash, role, tier, persona, KYC, subscription, GDPR `gdprErasedAt`, email, FCM |
| `AuthRefreshSession` | Refresh token hash, rotation, revoke |
| `EmailOtpChallenge` / `EmailOtpSendLog` | OTP email + rate limit audit |
| `Profile` | Tên, avatar, country, language |
| `Wallet` | `balanceVIG`, `lockedBalanceVIG`, `stripeCustId` |
| `Transaction` | Giao dịch ledger, `idempotencyKey` unique khi set |
| `ProcessedStripeEvent` | Idempotency webhook Stripe |
| `Business` | Merchant: owner, broker, map, VietQR fields, ad/trial fields |
| `Service` | Dịch vụ con của Business, `priceVIG` |
| `Booking` | Booking B2C–B2B: timeSlot UTC, lock VIG, QR hash, platform fee |
| `TourismService` / `TourismBooking` | Du lịch inbound: fee fields, FX lock |
| `SecureVault` | Tài liệu mã hóa |
| `TravelOrder` | Đơn travel (flight, esim, …) |
| `PiggyBank` | Thưởng bài học (parent/child) |
| `CharityFund` / `CharityLedgerEntry` | Quỹ + bút toán 1% |
| `BrokerCommissionEscrow` | Hoa hồng broker pending release |
| `MerchantBrokerActivation` | Bounty kích hoạt merchant |
| `AILog` / `LlmApiUsageLog` | Audit AI |
| `TranslationCache` | Cache dịch (hash unique) |
| `MarketingPost` / `MarketingTranslation` | Bài marketing / ngôn ngữ |

**Chưa xác định** toàn bộ model nếu schema dài hơn phần đã đọc — mở `schema.prisma` cho bảng cuối file.

## Relationships

- `User` 1—1 `Profile`, 1—1 `Wallet` (optional theo tạo wallet).  
- `User` 1—N `Business` (owner), `Booking`, `TourismBooking`, `AILog`, …  
- `Business` 1—N `Service`, `Booking`, `TourismService`, `TourismBooking`.  
- `Wallet` 1—N `Transaction`.  
- `User` N—1 `User` (broker hierarchy: `masterBrokerId`).  
- `Business` N—1 `User` (broker) optional qua `brokerId`.  
- Cascade: nhiều quan hệ `onDelete: Cascade` — đọc kỹ trước khi xóa User.

## Schema / Tables / Collections

- **Relational tables** map 1:1 Prisma models (snake_case trong DB tuỳ naming strategy — Prisma mặc định giữ `camelCase` hoặc map; kiểm tra migration SQL để chắc).
- **Firestore / B2B domain:** `src/domain/b2b/` có type Firestore — **song song** Prisma; không trộn trong một schema.

## Important Fields

| Field | Ý nghĩa |
|-------|---------|
| `User.phoneNumber` | E.164 unique |
| `User.pinCode` | Hash (ứng dụng layer) |
| `User.role` | `Role` enum |
| `Wallet.balanceVIG` / `lockedBalanceVIG` | Số dư vs khóa booking |
| `Booking.timeSlot` | **UTC** — API ISO 8601 |
| `Booking.completionQrTokenHash` | SHA-256, không lưu token thô |
| `TourismBooking.lockedEurVndRate` | FX lock du lịch |
| `Transaction.idempotencyKey` | Chống double debit |

## Validation Rules

- **Ứng dụng:** Zod trên một số route auth; logic PIN/email trong `AuthService` / `EmailOtpService`.  
- **DB:** `check` constraints trong SQL Supabase cho P2P VIG (amount > 0, …).  
- **Chưa xác định** một lớp validation thống nhất cho mọi controller — đọc từng controller.

## Migrations

- `prisma/migrations/` — Prisma migrate history.  
- Chạy: `npm run db:migrate` (dev), `prisma migrate deploy` (CI/prod).  
- **Không** chỉnh tay migration đã apply trên production.

## Seed Data

- **Chưa xác định** file seed chuẩn trong repo — tìm `prisma/seed` hoặc script trong `scripts/`.

## Data Integrity Notes

- Stripe: `ProcessedStripeEvent.stripeEventId` unique — chống replay.  
- Transfer wallet: unique `idempotencyKey` trên `Transaction` khi gửi.  
- Broker escrow: `idempotencyKey` unique trên `BrokerCommissionEscrow`.  
- GDPR: `wipeUserData` xóa/anonymize một phần — **không** xóa User row; refresh session cần xử lý rõ (xem code `UserService`).
