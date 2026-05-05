# VIONA Repo State Lock

**Mục đích:** Đóng băng trạng thái working tree trước khi sửa code.  
**Thời điểm ghi nhận:** tạo file từ kết quả lệnh read-only (`git status`, `git diff --name-only`, `git ls-files --others --exclude-standard`, `npm run typecheck`, `npm run lint`).  
**Quy ước:** Không dán nội dung secret; không suy diễn nội dung diff byte-level.

---

## 1. Git Status

Kết quả `git status --short`:

```
 M package-lock.json
 M package.json
 M prisma/schema.prisma
 M src/app.ts
 M src/controllers/AuthController.ts
 M src/middleware/RateLimitMiddleware.ts
 M src/routes/authRoutes.ts
 M src/services/auth/EmailOtpService.ts
 M testOtpRateLimit.js
?? docs/ai-context/
?? docs/audit/
?? prisma/migrations/20260503120000_auth_refresh_session/
?? src/middleware/validateBody.ts
?? src/validation/
```

*Ghi chú:* Sau khi thêm file này, `docs/audit/` sẽ có thêm `VIONA_REPO_STATE_LOCK.md` (untracked cho đến khi `git add`).

---

## 2. Modified Files

| File | Area | Likely Purpose | Risk | Should Touch Now? |
|------|------|----------------|------|-------------------|
| `package.json` | Tooling / deps | Thêm/sửa dependency (ví dụ zod) | Trung bình — ảnh hưởng cài đặt | Chỉ nếu task trùng scope |
| `package-lock.json` | Tooling | Khóa version theo `package.json` | Thấp | Tránh xung đột với task khác cùng sửa deps |
| `prisma/schema.prisma` | DB schema | Model/session (ví dụ `AuthRefreshSession`) | **Cao** — migration/DB | **Không** nên chồng thay đổi mơ hồ |
| `src/app.ts` | API server | Thứ tự middleware, mount route | **Cao** | Chỉ task có liên quan bảo mật/webhook |
| `src/controllers/AuthController.ts` | Auth API | Login/OTP/response | **Cao** | Chỉ nếu task auth |
| `src/middleware/RateLimitMiddleware.ts` | API hardening | Rate limit / bypass webhook | Trung bình–cao | Cẩn thận khi chạm |
| `src/routes/authRoutes.ts` | Routes | Gắn validateBody + auth | Cao | Chỉ task auth/validation |
| `src/services/auth/EmailOtpService.ts` | Auth service | OTP rate limit / gửi mail | **Cao** | Chỉ task OTP |
| `testOtpRateLimit.js` | Test script | Kiểm thử OTP (Node) | Thấp | OK cho script cùng luồng |

---

## 3. Untracked Files

| File/Folder | Area | Likely Purpose | Risk | Should Add Later? |
|---------------|------|----------------|------|-------------------|
| `docs/ai-context/*.md` | Docs | Bộ context cho AI (project, API, setup, mini-app platform, …) | Thấp | **Có** — commit doc khi ổn định |
| `docs/audit/VIONA_CODEBASE_AUDIT.md` | Audit | Báo cáo audit codebase | Thấp | **Có** |
| `docs/audit/VIONA_REPO_STATE_LOCK.md` | Audit | File lock state (bản này) | Thấp | **Có** |
| `prisma/migrations/20260503120000_auth_refresh_session/migration.sql` | DB | Migration bảng refresh session | **Cao** với DB | **Có**, sau review + khi sẵn sàng `migrate` |
| `src/middleware/validateBody.ts` | API | Middleware Zod body | Trung bình | **Có** cùng commit với `authRoutes` nếu là một feature |
| `src/validation/authSchema.ts` | API | Schema Zod cho auth | Trung bình | **Có** cùng cây auth |

*Thư mục `docs/ai-context/` chứa nhiều file `.md` — không liệt kê từng file trong bảng để tránh trùng lặp; coi là **docs-only**.*

---

## 4. Docs/Audit Files

Chỉ tài liệu / audit (không phải runtime app):

- `docs/ai-context/` — toàn bộ `.md` onboarding AI + mini-app architecture.
- `docs/audit/VIONA_CODEBASE_AUDIT.md` — audit codebase.
- `docs/audit/VIONA_REPO_STATE_LOCK.md` — báo cáo lock repo (file này).

---

## 5. Code Files Already Modified

| File | Ghi chú |
|------|---------|
| `package.json` / `package-lock.json` | **Chưa xác định** chi tiết diff — có khả năng liên quan dependency validation (ví dụ zod). |
| `prisma/schema.prisma` | Khớp cụm Auth refresh session đã thấy trong conversation history — **Chưa xác định** đầy đủ diff cục bộ. |
| `src/app.ts` | Có thể bypass Stripe webhook / rate limit — **Chưa xác định** từng dòng. |
| `src/controllers/AuthController.ts` | Logger / OTP/login — **Chưa xác định**. |
| `src/middleware/RateLimitMiddleware.ts` | Bypass `/api/pay/webhook/stripe` — **Chưa xác định**. |
| `src/routes/authRoutes.ts` | Zod `validateBody` — **Chưa xác định**. |
| `src/services/auth/EmailOtpService.ts` | OTP rate limiting — **Chưa xác định**. |
| `testOtpRateLimit.js` | Script test OTP — **Chưa xác định**. |

---

## 6. Typecheck/Lint

| Script | Kết quả |
|--------|---------|
| `npm run typecheck` | **pass** (exit code 0) |
| `npm run lint` (`expo lint`) | **fail** (exit code 1) — **61 vấn đề**: **10 errors**, **51 warnings** |

**Lint errors (không ghi nội dung nhạy cảm):** gồm `react/no-unescaped-entities`, `react-hooks/rules-of-hooks` (vd. `WalletTopUpScreen.tsx`), `import/no-unresolved` (`express-augment.d.ts`), v.v. — chi tiết trong stdout của `npm run lint`.

---

## 7. Risk Assessment

- **Có an toàn để bắt đầu task code nhỏ chưa?**  
  **Được**, với điều kiện: task **tránh** chồng lên nhóm **auth + Prisma + OTP** đang modified/untracked trừ khi đó **chính là** mục tiêu; và chấp nhận **lint đang fail** — task mới không nên làm tệ hơn.

- **File không nên đụng trong task tiếp theo** (nếu task không phải auth/migration):  
  `prisma/schema.prisma`, `prisma/migrations/20260503120000_auth_refresh_session/migration.sql`, `src/controllers/AuthController.ts`, `src/services/auth/EmailOtpService.ts`, `src/routes/authRoutes.ts`, `src/middleware/validateBody.ts`, `src/validation/authSchema.ts`, `testOtpRateLimit.js`.

- **Cần review thủ công:**  
  Toàn bộ **nhóm auth refresh + Zod + OTP** trước khi merge; **`src/app.ts`** nếu đụng webhook; **`WalletTopUpScreen.tsx`** (hooks error trong lint).

---

## 8. Final Recommendation

- **Có nên code tiếp không?**  
  **Có** — nhưng nên **hoàn tất hoặc commit một nhánh** cho nhóm auth/OTP/schema đang dở để tránh conflict; hoặc **freeze** và chỉ làm task **ngoài** các file đã liệt kê.

- **Task code đầu tiên nên là gì?**  
  Một trong hai hướng (chọn một):  
  1) **Đóng feature auth refresh + OTP + migration** (review → migrate dev DB → commit một cụm).  
  2) **Tách task khác** chỉ đụng file **không** nằm trong bảng modified (ví dụ fix lint errors trên file không liên quan auth — **lưu ý** lint có lỗi hooks ở `WalletTopUpScreen` nếu chọn hướng “sửa lint”).

---

*Báo cáo sinh bằng lệnh read-only; không thực hiện git write, không sửa code.*
