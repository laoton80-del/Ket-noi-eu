# API Reference

## Overview

- **Base URL:** `http://localhost:<API_PORT>` (mặc định **8787** — `src/server.ts`) hoặc domain production.
- **Envelope:** `{ success: true, data: T }` hoặc `{ success: false, error: string }` (`src/utils/apiEnvelope.ts`).
- **Rate limiting:** `pathAwareApiRateLimiter` — AI routes chặt hơn; `/api/pay/webhook/stripe` và `/health` không áp dụng giới hạn chung như các route khác.

## Authentication

| Cơ chế | Chi tiết |
|--------|----------|
| JWT | Header `Authorization: Bearer <access_token>` |
| Secret | `JWT_SECRET` (server) |
| Subject | Claim `sub` → `req.authUserId` trong middleware |

**Public (không JWT):** `GET /health`, `POST /api/auth/login`, `POST /api/auth/email/otp/request`, `POST /api/auth/email/otp/verify`, `POST /api/pay/webhook/stripe` (Stripe signature), `GET /api/charity/totals`, `GET /api/tourism/discover`.

---

## Endpoints / Actions

### Health check

- **Method:** `GET`
- **Path:** `/health`
- **Purpose:** Kiểm tra API sống.
- **Request:** —
- **Response:** `{ success: true, data: { status: 'ok' } }`
- **Errors:** —
- **Used By:** Load balancer, dev, scripts.
- **Related Files:** `src/app.ts`

---

### Login (phone + PIN)

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Purpose:** Đăng nhập; nhận JWT (và có thể các field khác — xem `AuthController`).
- **Request:** JSON validate bởi `postLoginBodySchema` (`src/validation/authSchema.ts`).
- **Response:** Envelope success với token/user (đọc controller để biết shape chính xác).
- **Errors:** 400 validation; 401/429 theo logic auth.
- **Used By:** App login screen.
- **Related Files:** `src/routes/authRoutes.ts`, `src/controllers/AuthController.ts`

---

### Email OTP — request

- **Method:** `POST`
- **Path:** `/api/auth/email/otp/request`
- **Purpose:** Gửi mã OTP qua SES.
- **Request:** `postEmailOtpRequestBodySchema`.
- **Response:** Success envelope.
- **Errors:** 500 nếu thiếu SES/`JWT_SECRET`; 429 rate limit OTP.
- **Used By:** Sign-up / verify email flows.
- **Related Files:** `AuthController`, `EmailOtpService`

---

### Email OTP — verify

- **Method:** `POST`
- **Path:** `/api/auth/email/otp/verify`
- **Purpose:** Xác minh OTP và hoàn tất luồng (session/token — xem controller).
- **Request:** `postEmailOtpVerifyBodySchema`.
- **Related Files:** `authRoutes.ts`, `AuthController.ts`

---

### Stripe webhook

- **Method:** `POST`
- **Path:** `/api/pay/webhook/stripe`
- **Purpose:** `payment_intent.succeeded` → cấp VIG / broker side effects (idempotent).
- **Request:** Raw JSON body; header `Stripe-Signature`.
- **Response:** JSON `{ received, fulfillment | ignored | error }` (xem `StripeWebhookController`).
- **Errors:** 400 signature/metadata; 500 fulfillment.
- **Used By:** Stripe Dashboard endpoint config only.
- **Related Files:** `src/app.ts`, `StripeWebhookController.ts`, `StripeWebhookService.ts`, `WalletService.ts`

---

### Wallet balance

- **Method:** `GET`
- **Path:** `/api/wallet/balance`
- **Purpose:** Lấy số dư VIG (và có thể locked — xem controller).
- **Auth:** JWT.
- **Related Files:** `walletRoutes.ts`, `WalletController.ts`

---

### Wallet transfer

- **Method:** `POST`
- **Path:** `/api/wallet/transfer`
- **Purpose:** Chuyển VIG P2P (server-side validation + rate limit).
- **Auth:** JWT + `walletTransferRateLimitMiddleware`.
- **Related Files:** `walletRoutes.ts`, `WalletController.ts`

---

### Pay — QR merchant

- **Method:** `POST`
- **Path:** `/api/pay/qr-merchant`
- **Purpose:** Thanh toán QR / merchant context (chi tiết body trong `PaymentController`).
- **Auth:** JWT.

---

### Pay — merchant ledger

- **Method:** `GET`
- **Path:** `/api/pay/merchant-ledger`
- **Purpose:** Lịch sử / ledger merchant.
- **Auth:** JWT.

---

### Pay — VietQR

- **Method:** `GET`
- **Path:** `/api/pay/viet-qr`
- **Purpose:** Sinh hoặc trả metadata VietQR cho merchant.
- **Auth:** JWT.

---

### Bookings — create

- **Method:** `POST`
- **Path:** `/api/bookings/`
- **Purpose:** Tạo booking.
- **Auth:** JWT.

---

### Bookings — complete via QR

- **Method:** `POST`
- **Path:** `/api/bookings/complete-via-qr`
- **Purpose:** Hoàn tất booking có khóa VIG qua QR (luồng an toàn).
- **Auth:** JWT.

---

### Bookings — cancel

- **Method:** `POST`
- **Path:** `/api/bookings/cancel`
- **Auth:** JWT.

---

### Bookings — complete (legacy)

- **Method:** `POST`
- **Path:** `/api/bookings/complete`
- **Purpose:** Deprecated — controller trả **410** (insecure without QR).
- **Auth:** JWT.

---

### Tourism — discover

- **Method:** `GET`
- **Path:** `/api/tourism/discover`
- **Purpose:** Catalog discovery (public).
- **Auth:** Không.

---

### Tourism — quote

- **Method:** `POST`
- **Path:** `/api/tourism/quote`
- **Auth:** JWT.

---

### Tourism — book

- **Method:** `POST`
- **Path:** `/api/tourism/book`
- **Auth:** JWT.

---

### Tourism — viral wrap

- **Method:** `GET`
- **Path:** `/api/tourism/wrap/:bookingId`
- **Auth:** JWT.

---

### Tourism — complete booking

- **Method:** `POST`
- **Path:** `/api/tourism/bookings/:bookingId/complete`
- **Auth:** JWT.

---

### Broker — register business

- **Method:** `POST`
- **Path:** `/api/broker/register-business`
- **Purpose:** Broker tạo business + QR attribution.
- **Auth:** JWT + broker role (`brokerMiddleware`).

---

### Broker — commissions

- **Method:** `GET`
- **Path:** `/api/broker/commissions`
- **Auth:** JWT + broker.

---

### Business — my ranking

- **Method:** `GET`
- **Path:** `/api/business/ranking/me`
- **Auth:** JWT.

---

### Business — ranking by id

- **Method:** `GET`
- **Path:** `/api/business/:businessId/ranking`
- **Auth:** JWT.

---

### AI — legal scan

- **Method:** `POST`
- **Path:** `/api/ai/legal-scan`
- **Auth:** JWT + AI rate limit tier.

---

### AI — translate travel phrase

- **Method:** `POST`
- **Path:** `/api/ai/translate/travel-phrase`
- **Auth:** JWT.

---

### AI — chat completion

- **Method:** `POST`
- **Path:** `/api/ai/chat-completion`
- **Auth:** JWT.

---

### Education — complete lesson

- **Method:** `POST`
- **Path:** `/api/edu/complete-lesson`
- **Auth:** JWT.

---

### Education — piggy bank

- **Method:** `POST`
- **Path:** `/api/edu/piggy-bank`
- **Auth:** JWT.

---

### Charity — totals

- **Method:** `GET`
- **Path:** `/api/charity/totals`
- **Purpose:** Tổng quỹ charity (public).
- **Auth:** Không.

---

### Users — push token

- **Method:** `PATCH`
- **Path:** `/api/users/push-token`
- **Auth:** JWT.

---

### Users — persona

- **Method:** `PATCH`
- **Path:** `/api/users/persona`
- **Auth:** JWT.

---

### Users — GDPR erase

- **Method:** `POST`
- **Path:** `/api/users/gdpr/erase`
- **Auth:** JWT.

---

### Admin — tourism stats

- **Method:** `GET`
- **Path:** `/api/admin/tourism-stats`
- **Auth:** JWT + super admin.

---

### Admin — marketing posts (CRUD subset)

- **Method:** `GET` `/api/admin/marketing/posts`  
- **Method:** `PUT` `/api/admin/marketing/posts/:id`  
- **Method:** `POST` `/api/admin/marketing/posts/:id/publish`  
- **Method:** `POST` `/api/admin/marketing/posts/:id/approve-and-translate`  
- **Method:** `DELETE` `/api/admin/marketing/posts/:id`  
- **Method:** `POST` `/api/admin/trigger-auto-post`  
- **Auth:** JWT + super admin.

---

### Media — image upload

- **Method:** `POST`
- **Path:** `/api/media/image`
- **Purpose:** Upload ảnh (Multer).
- **Auth:** JWT (`mediaRoutes.ts`).
- **Related Files:** `src/routes/mediaRoutes.ts`

---

## Socket.IO

- **Path:** `/socket.io` trên cùng cổng HTTP (`src/server.ts`).
- **Purpose:** WebRTC signaling (`attachSignalingServer`).
- **Auth:** **Chưa xác định** chi tiết handshake token trong doc này — đọc `SignalingServer.ts`.
