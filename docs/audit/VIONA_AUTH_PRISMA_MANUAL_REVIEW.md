# VIONA Auth / Prisma Manual Review

**Vai trò:** Senior Backend Security Auditor + Prisma Migration Reviewer (read-only).  
**Phạm vi:** Group F — Auth / Prisma / Migration / Validation / Rate Limit / `app.ts` / `WalletService` (đường dẫn `src/services/WalletService.ts` theo `git status`).  
**Quy ước:** Không dán secret; không chạy migration trong audit này.

---

## 1. Executive Summary

| Câu hỏi | Kết luận |
|---------|----------|
| **Nhóm Auth/Prisma hiện có an toàn không?** | **Nhìn chung cải thiện** so với baseline: thêm validate body (Zod), giới hạn gửi OTP theo email có cơ sở DB, log lỗi có cấu trúc, bypass rate limit rõ ràng cho Stripe webhook. **Rủi ro còn lại:** bảng `AuthRefreshSession` **chưa có code sử dụng** trong `src/` (migration + schema “đi trước” app); rate limit vẫn **in-memory** (đã biết từ trước). |
| **Có nên commit riêng nhóm này không?** | **Có — nên tách** khỏi thay đổi UI/feature khác. Có thể **tách thêm** migration/schema refresh nếu team chưa muốn tạo bảng chưa dùng. |
| **Có migration nào nguy hiểm không?** | Migration chỉ **CREATE TABLE** + index + FK — **không** `DROP`, **không** `ALTER` bảng cũ. **Nguy hiểm thấp** về data loss; **rủi ro vận hành** thấp (bảng mới rỗng). |
| **Có thay đổi nào có thể phá login / OTP / session không?** | **OTP request:** cửa sổ rate limit đổi từ **10 phút → 60 phút** (3 lần/email) — hành vi **chặt hơn**, có thể làm **429** nhiều hơn so với trước; message API đã đổi cho khớp. **Login/verify:** thêm Zod — input hợp lệ như trước vẫn qua; edge case (khoảng trắng email) có thể khác nhẹ do `.trim()` trong schema. **Session JWT:** `verifyEmailOtp` / `issueSessionForUserId` **không** thấy đổi trong diff. |
| **Có thay đổi nào có thể ảnh hưởng Stripe webhook trong `app.ts` không?** | **Không thấy** đổi thứ tự middleware quan trọng: route webhook vẫn **`express.raw` trước `express.json`**. Chỉ **bổ sung comment** trong diff. **Rate limit:** thêm bypass path `/api/pay/webhook/stripe` trong `pathAwareApiRateLimiter` — **giảm** nguy cơ 429 cho webhook nếu thứ tự mount thay đổi sau này. |
| **`WalletService.ts` có thật sự thay đổi không?** | **`git diff` / `git diff HEAD` / `--numstat` không có hunk nội dung** (chỉ cảnh báo CRLF từ Git). **Kết luận:** **không có thay đổi logic** được Git coi là khác biệt dòng; `git status` **M** rất có thể do **line endings / normalisation** hoặc metadata. *(Repo còn các file khác tên `WalletService.ts` dưới `payment/`, `api/`, `fintech/` — không nằm trong `git status` dòng `src/services/WalletService.ts`.)* |

---

## 2. Git Snapshot

### `git status --short` (rút gọn — chỉ mục liên quan Group F)

```
 M package-lock.json
 M package.json
 M prisma/schema.prisma
 M src/app.ts
 M src/controllers/AuthController.ts
 M src/middleware/RateLimitMiddleware.ts
 M src/routes/authRoutes.ts
 M src/services/WalletService.ts
 M src/services/auth/EmailOtpService.ts
 M src/types/express-augment.d.ts
 M testOtpRateLimit.js
?? prisma/migrations/20260503120000_auth_refresh_session/
?? src/middleware/validateBody.ts
?? src/validation/authSchema.ts
```

*(Toàn bộ working tree còn nhiều file khác — xem audit grouping.)*

### Tóm tắt diff Group F (theo lệnh đã chạy)

| File | Thay đổi chính (tóm tắt) |
|------|---------------------------|
| `prisma/schema.prisma` | +`AuthRefreshSession`, quan hệ `User.authRefreshSessions` |
| `AuthController.ts` | `logger.error` thay `console.error`; message 429 OTP |
| `EmailOtpService.ts` | `OTP_SEND_WINDOW_MS` 10m→60m; đếm `emailOtpSendLog` trước khi gửi |
| `authRoutes.ts` | `validateBody` + schema Zod cho 3 route |
| `RateLimitMiddleware.ts` | Bypass `/api/pay/webhook/stripe`; comment |
| `app.ts` | Comment Stripe webhook / thứ tự middleware |
| `package.json` / lock | +`zod` ^4.4.2 |
| `express-augment.d.ts` | Chuyển augment sang `global` / `Express.Request` |
| `testOtpRateLimit.js` | Comment cập nhật 3/giờ |
| `WalletService.ts` | **Không có patch trong diff** |

### `git ls-files --others --exclude-standard` (Group F)

```
prisma/migrations/20260503120000_auth_refresh_session/migration.sql
src/middleware/validateBody.ts
src/validation/authSchema.ts
```

---

## 3. Prisma Schema Review

| Area | Change | Risk | Migration Needed? | Recommendation |
|------|--------|------|-------------------|----------------|
| Model mới | `AuthRefreshSession` | Thấp (additive) | **Có** — file migration đã có | Chạy migrate **sau** review + backup DB |
| Field | `tokenHash` unique, timestamps, rotation FK | Thấp | Đã có trong SQL | Đảm bảo app chỉ lưu **hash** (comment schema đúng) |
| Relation | `User` → `authRefreshSessions[]`, `onDelete: Cascade` | Trung — xóa user xóa session | Đã có | Phù hợp GDPR-style cleanup |
| Relation | `replacedBySessionId` self-FK, `onDelete: SetNull` | Thấp | Đã có | Hỗ trợ rotation chain |
| Index | `(userId, expiresAt)`, `(userId, revokedAt)` | Thấp | Đã có | Hợp lý cho purge/query |
| Enum | Không đổi | — | — | — |
| Nullable | Các field optional (`lastUsedAt`, `revokedAt`, `replacedBySessionId`) | Thấp | — | OK |
| Data loss | Không đụng bảng cũ | **Không** | — | — |
| Backward compat | Client cũ không phụ thuộc bảng mới | OK | — | **Lưu ý:** chưa có API refresh — bảng **optional** cho đến khi implement |

**Phát hiện:** `grep` trong `src` **không** có `AuthRefreshSession` / `authRefreshSession` — **schema + migration đi trước implementation**. Không phá build hiện tại nhưng là **nợ kỹ thuật / scope** cần ghi rõ trong PR.

---

## 4. Migration Review

**File:** `prisma/migrations/20260503120000_auth_refresh_session/migration.sql`

| SQL Operation | Risk | Data Loss? | Rollback Concern | Recommendation |
|---------------|------|------------|------------------|----------------|
| `CREATE TABLE "AuthRefreshSession"` | Thấp | Không | Drop table nếu rollback thủ công | OK |
| `UNIQUE` trên `tokenHash` | Thấp | Không | — | OK |
| `UNIQUE` trên `replacedBySessionId` | Thấp | Không | — | OK |
| `INDEX` composite | Thấp | Không | — | OK |
| `FK` → `User(id)` `ON DELETE CASCADE` | Trung (theo policy xóa user) | Xóa user sẽ xóa session | Hiểu rõ cascade | Chấp nhận nếu đúng policy |
| `FK` self `ON DELETE SET NULL` | Thấp | Không | — | OK |
| `DEFAULT CURRENT_TIMESTAMP` trên `createdAt` | Thấp | Không | — | OK |
| `DROP` / `ALTER` bảng legacy | **Không có** | — | — | — |

**Không chạy migration** trong phiên audit này.

---

## 5. Auth Flow Review

| File | Change | Security Impact | Compatibility Impact | Recommendation |
|------|--------|-----------------|----------------------|----------------|
| `AuthController.ts` | Log structured; message 429 | Tốt hơn (ít `console`); không lộ OTP trong diff | Client nhận message 429 khác chữ | OK nếu client chỉ đọc status code |
| `authRoutes.ts` | `validateBody` trước handler | Giảm malformed body / prototype pollution surface | Body phải khớp schema (email lowercased, OTP 6 số) | Kiểm tra client gửi đúng field |
| `authSchema.ts` | Zod email + OTP + login | Chuẩn hoá input | PIN `min(6)` — **Chưa xác định** có client gửi PIN ngắn hơn không | So khớp với `AuthService` |
| `validateBody.ts` | `safeParse`, 400 + message issues | An toàn (fail closed) | Lỗi 400 chi tiết hơn | Tránh lộ chi tiết nội bộ nếu cần — hiện chỉ Zod message |

**Refresh session / logout:** **Chưa xác định** route refresh mới trong diff — không đổi flow logout cũ trong phạm vi review này.

---

## 6. Email OTP Review (`EmailOtpService.ts`)

| Concern | Current Behavior | Risk | Recommendation |
|---------|------------------|------|----------------|
| OTP generation | `crypto.randomInt` 6 số | Thấp | Giữ |
| OTP expiry | 10 phút TTL | Thấp | OK |
| Retry / resend | Xóa challenge cũ, tạo mới; log send | Trung — spam SES | Đã thêm **3 send / email / 60 phút** qua `emailOtpSendLog` |
| Brute force verify | `MAX_ATTEMPTS = 6`, tăng `attemptCount` | Trung | OK |
| Email enumeration | `requestEmailOtp` vẫn trả `invalid_email` vs `rate_limited` vs `sent` | Trung (có sẵn) | Xem xét response đồng nhất nếu cần hardening (ngoài diff) |
| SES failure | `smtp_not_configured` → 503 qua controller | Thấp | OK |
| Logging OTP | **Email gửi chứa mã plaintext** trong `sendEmail` (đã có trước diff) | Vận hành (email channel) | Không mới; không log OTP vào `logger` trong diff |
| Rate limit integration | Per-email DB count **trước** gửi; khớp message controller “3 per hour” | Thấp | Đảm bảo `EmailOtpSendLog` **luôn được tạo sau send thành công** (trong code: sau `sendEmail`) — tránh lệch đếm nếu send fail giữa chừng (**Chưa xác định** transaction) |

---

## 7. Rate Limit Review (`RateLimitMiddleware.ts`)

| Tiêu chí | Quan sát | Risk |
|----------|-----------|------|
| IP / proxy | `trust proxy` + `x-forwarded-for` khi `trustHops > 0` | IP spoof nếu proxy không tin cậy — **đã có sẵn thiết kế** |
| Per-route | `/health` skip; webhook skip; `/api/ai/` strict; `/api/auth/` auth bucket; else general | OK |
| OTP abuse | Auth path 5 req/s/IP **và** per-email 3/h trong service | Lớp kép — tốt |
| Memory store | `Map` in-memory | Multi-node không chia sẻ — **P2** production |
| Webhook bypass | Explicit path match | Giảm 429 Stripe — tích cực |

---

## 8. `app.ts` Review

| Kiểm tra | Kết quả |
|----------|---------|
| Stripe raw body | `POST /api/pay/webhook/stripe` dùng `express.raw` **trước** `express.json` | **OK** |
| Middleware order | `cors` → webhook → `json` → `pathAwareApiRateLimiter` → routes | **OK** |
| Auth routes | `app.use('/api/auth', authRouter)` sau rate limiter | **OK** — webhook không đi qua json+limiter theo route riêng |
| JSON parser | `express.json` sau webhook | **OK** |

**Kết luận:** Thay đổi trong diff **không** phá xác minh chữ ký Stripe do thứ tự body.

---

## 9. WalletService Anomaly Review

**File theo `git status`:** `src/services/WalletService.ts`

| Check | Result | Notes |
|-------|--------|-------|
| `git status` | `M` | — |
| `git diff` (working tree vs index) | **Không có hunk** | Chỉ stderr CRLF warning |
| `git diff HEAD` | **Không có hunk** | — |
| `git diff --numstat` | **Rỗng** | — |
| Khả năng CRLF | Cao | `core.autocrlf` / EOL |
| Khả năng logic thay đổi | **Không có bằng chứng trong diff** | Nếu cần chắc chắn: so sánh `git hash-object` hoặc `fc /b` ngoài Git |
| Trùng tên file | Repo có thêm `src/services/payment/WalletService.ts` | **Khác file** — lint cảnh báo import order trên `payment/` |

**Khuyến nghị:** `git add --renormalize` hoặc `git checkout --` sau khi xác nhận EOL policy — **ngoài scope** audit nếu không được phép ghi Git.

---

## 10. Package Change Review

| Dependency / Script | Change | Risk | Needed? | Recommendation |
|---------------------|--------|------|---------|----------------|
| `zod` ^4.4.2 | Dependency mới | Thấp (MIT); major v4 API khác v3 | **Có** cho `validateBody` / `authSchema` | Giữ lockfile đồng bộ |
| `package-lock.json` | Entry `node_modules/zod` | Thấp | Có | Commit cùng `package.json` |

**Không** thấy script mới trong diff `package.json`.

---

## 11. Typecheck / Lint

| Kiểm tra | Kết quả |
|----------|---------|
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** (0 errors, **51 warnings** repo-wide) |
| Liên quan Group F | Warnings `import/first` trên **`src/services/payment/WalletService.ts`** — **khác file** với `src/services/WalletService.ts` trong `git status` |

---

## 12. Risk Classification

| Priority | Issue | Evidence | Recommendation |
|----------|-------|----------|----------------|
| **P0** | Triển khai DB migration trên prod không có kế hoạch | Bảng mới + chưa có API refresh | Chỉ migrate khi sẵn sàng; backup trước |
| **P1** | `AuthRefreshSession` chưa có code — “dead table” | Không match trong `src` | Ghi README/PR hoặc tách PR migration |
| **P1** | OTP 3/giờ/email — thay đổi hành vi | `OTP_SEND_WINDOW_MS` + log count | Thông báo team / kiểm tra UX |
| **P2** | Rate limit in-memory | `RateLimitMiddleware` | Redis sau khi scale |
| **P2** | `WalletService.ts` status “dirty” không diff | CRLF | Chuẩn hoá EOL |

---

## 13. Recommended Action

**Chọn: B — Group F cần làm rõ / chỉnh nhỏ trước khi commit**

**Giải thích:** Thay đổi kỹ thuật **hướng tích cực** (validation, OTP abuse, webhook bypass, logging). Tuy nhiên: (1) **migration + model refresh chưa có implementation** — cần **quyết định có commit bảng “trước code”** hay tách PR; (2) **`src/services/WalletService.ts` hiển thị `M` nhưng không có diff** — nên **xử lý EOL / index** để working tree sạch; (3) **OTP window** đổi — cần **đồng bộ tài liệu / client** nếu có hardcode kỳ vọng cũ.

*(Nếu team chấp nhận bảng refresh trước API: có thể nới thành **A** sau khi ghi chú PR.)*

---

## 14. Next Step After Group F

Nếu Group F đã **đóng gói commit** (hoặc tách PR xong):

1. **Finish VIO cleanup** — copy còn “VIG Token” public (Loyalty/Local) không phụ thuộc auth.
2. **Navigation Super App Lite Alignment** — sau khi foundation và auth ổn định.

**Kết luận:** Auth/Prisma **không chặn** hai task trên về mặt dependency runtime, nhưng **nên ổn định Git + migration policy** trước để giảm rủi ro release.

---

## Phụ lục — Yêu cầu output

### Top 10 phát hiện quan trọng

1. **`AuthRefreshSession`:** schema + migration **có**, code **không** dùng — cần quyết định PR/mục tiêu.
2. **OTP:** giới hạn **3 lần / email / 60 phút** (trước đây comment/script nói 10 phút) — hành vi **chặt hơn**.
3. **`authRoutes`:** Zod `validateBody` — cải thiện input validation.
4. **`RateLimitMiddleware`:** bypass **`/api/pay/webhook/stripe`** — giảm rủi ro 429 webhook.
5. **`app.ts`:** chỉ đổi comment; **Stripe raw vẫn trước `express.json`**.
6. **`AuthController`:** `logger.error` thay `console.error` trên OTP request.
7. **`express-augment.d.ts`:** đổi kiểu augment — **typecheck pass**.
8. **`zod` 4.4.2** thêm vào dependencies.
9. **Migration SQL:** chỉ `CREATE` + FK/index — **không DROP** bảng cũ.
10. **`src/services/WalletService.ts`:** **`M` nhưng không có diff** — rất có thể **CRLF / normalisation**, không phải logic.

### Recommendation letter

**B** (làm rõ nhỏ + EOL WalletService + policy bảng refresh trước khi gọi Group F “xong”).

### Có nên code tiếp feature mới chưa?

**Chưa nên** cho đến khi: (1) quyết định migrate/PR Group F; (2) làm sạch trạng thái `WalletService.ts` hoặc xác nhận vô hại; (3) team đồng ý thay đổi OTP rate. Sau đó có thể tiếp tục **VIO** / **Navigation**.
