# AI Coding Rules

Quy tắc bắt buộc cho AI (ChatGPT, Claude, Gemini, Cursor) khi làm việc trong repo **ket-noi-global**.

## Golden Rules

1. **Không tự ý đổi kiến trúc** (tách server, đổi ORM, đổi stack auth, đổi envelope API) trừ khi user yêu cầu rõ ràng.
2. **Không sửa nhiều file ngoài phạm vi task** — ưu tiên diff nhỏ, đúng chỗ.
3. **Không xóa** code đang dùng hoặc comment “dead” nếu chưa chứng minh không tham chiếu.
4. **Không đổi contract API** (path, shape JSON, mã lỗi) mà không cập nhật **toàn bộ** client + server + test smoke.
5. **Không commit hoặc ghi giá trị** `.env`, secret, khóa Stripe/AWS/OpenAI vào doc hoặc code public.
6. **Luôn đọc** `docs/ai-context/PROJECT_CONTEXT.md` và `ARCHITECTURE.md` trước khi sửa logic nghiệp vụ.

## Before Coding

- Đọc task và xác định **route / service / screen** liên quan.
- Tìm chỗ hiện tại xử lý (grep, không đoán).
- **Giải thích plan ngắn** (bullet) cho user trước khi tool-edit nếu task không tầm thường.

## While Coding

- Khớp **style hiện có**: import, naming, pattern controller → service → Prisma.
- Dùng **`jsonOk` / `jsonFail`** cho API; không trả JSON lẻ loi không envelope.
- Validation input: ưu tiên **Zod** + `validateBody` cho route mới (theo mẫu `authRoutes`).
- Tiền / ví / Stripe: đọc `WalletService`, `StripeWebhookService`, `V7FinancialRules` trước — không tự invent fee.
- TypeScript: giữ **typecheck** (`npm run typecheck`) pass nếu CI có.

## After Coding

- Liệt kê **tất cả file đã đổi** và tóm tắt từng thay đổi.
- Nếu thêm biến môi trường: cập nhật **`.env.example`** (tên biến + mô tả), không ghi secret.
- Cập nhật **`docs/ai-context/CURRENT_STATE.md`** khi kết thúc phiên (nếu user dùng quy trình handoff).

## Files AI Should Read First

| Thứ tự | File / thư mục |
|--------|----------------|
| 1 | `docs/ai-context/PROJECT_CONTEXT.md`, `ARCHITECTURE.md` |
| 2 | `package.json` (scripts) |
| 3 | `src/app.ts` (mount routes) |
| 4 | `prisma/schema.prisma` (nếu đụng DB) |
| 5 | Route liên quan `src/routes/<domain>Routes.ts` + controller tương ứng |
| 6 | `.env.example` (API) |

## Files AI Should Avoid Editing

| Khu vực | Lý do |
|---------|--------|
| `node_modules/` | Không bao giờ |
| `prisma/migrations/*` đã tồn tại | Không sửa lịch sử; tạo migration mới nếu cần |
| `assets/`, `google-services.json`, plist | Trừ khi task design/build |
| Nhiều màn hình cùng lúc | Trừ khi user yêu cầu refactor lớn |

*Lưu ý:* `docs/ai-context/*.md` **nên** cập nhật khi thay đổi kiến trúc — đó là ngoại lệ “nhiều file” có chủ đích.

## Naming Conventions

- **Files:** `PascalCase` cho screen component; `camelCase` cho service/helper; `*Routes.ts`, `*Controller.ts`, `*Service.ts` theo mẫu hiện có.
- **API:** path kebab/plural theo chuẩn repo (`/api/wallet/balance`, `/api/users/gdpr/erase`).
- **Prisma:** model `PascalCase`, field `camelCase` (theo `schema.prisma`).

## Code Style

- TypeScript strict theo `tsconfig`; tránh `any` không cần thiết.
- Log lỗi: `logger.error({ err }, 'context')` — không `console.log` trong API production path (trừ script dev).

## Testing Requirements

- **Chưa xác định** một bộ test tự động thống nhất (Jest) trong toàn repo — trước khi merge lớn: chạy `npm run typecheck`, `npm run smoke` nếu có, và script preflight liên quan từ `package.json`.
- Thêm test mới: theo cùng thư mục `scripts/` hoặc pattern user chỉ định.

## Security Rules

- Không log token, PIN, `Authorization` header, raw Stripe body.
- Mọi thao tác nhạy cảm phải **auth** đúng middleware; không expose internal id không kiểm tra ownership trong query Prisma.
- Webhook Stripe: chỉ tin sau **verify signature**.

## Refactor Rules

- Refactor chỉ khi: giảm duplicate rõ ràng, fix bug, hoặc user yêu cầu.
- Không đổi tên biến public/export ngược semantic versioning nội bộ app.

## Commit / Change Summary Format

```
<tóm tắt một dòng>

- File: thay đổi gì
- File: thay đổi gì
```

## Definition of Done

- [ ] Đúng phạm vi task
- [ ] Không phá envelope API / auth
- [ ] `typecheck` pass (nếu sửa TS)
- [ ] Đã liệt kê file đổi
- [ ] Nếu cần: cập nhật `docs/ai-context/CURRENT_STATE.md` hoặc `API_REFERENCE.md`
