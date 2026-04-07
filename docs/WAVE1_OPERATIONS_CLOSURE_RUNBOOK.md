# Wave 1 — Runbook đóng vận hành (FAIL → PASS)

Tài liệu này bổ sung `docs/WAVE1_CLOSURE_EVIDENCE.md`. **Không thay thế** bằng chứng runtime: mọi mục “ops” phải có log/artifact thật đính kèm PR hoặc release ticket.

---

## A. Thay đổi code/repo còn thiếu (trước khi chạy ops)

| File / nhóm | Việc cần làm | Vì sao |
|-------------|--------------|--------|
| `functions/lib/index.js` | Sau `cd functions && npm run build`, **commit** nếu diff so với `HEAD` | `CI=true npm run functions:verify-bundle` yêu cầu `functions/lib` khớp `HEAD` (`scripts/verify-functions-bundle.mjs`) |
| `scripts/verify-receipt-strictness.mjs` | **Track trong git** (nếu đang untracked) | Harness W1-04; không có trong repo → team không tái lập được |
| `functions/scripts/seed-payment-receipt.cjs` | **Track trong git** | Seed receipt cho `seeded-flow` |
| `.github/workflows/release-discipline.yml` | **Track trong git** | Chứng cứ CI `ci:release-discipline` |
| `docs/WAVE1_CLOSURE_EVIDENCE.md`, `docs/D8_RUNTIME_SENSITIVE_MONEY_PATHS.md`, file này | **Track trong git** | Audit nhị phân cần commit hash cố định |

Không đổi phạm vi sản phẩm; chỉ đảm bảo artifact closure nằm trên nhánh release candidate.

---

## B. Chuỗi lệnh đóng Wave 1 (thứ tự nghiêm ngặt)

### B1 — Máy local (sạch, đã `git pull`, dependency đủ)

```bash
# 1) Cài dependency gốc (giống CI)
npm ci

# 2) Bundle Functions khớp nguồn
cd functions && npm ci && npm run build && cd ..

# 3) Nếu git status báo đổi functions/lib → stage + commit cùng src liên quan
git add functions/lib/index.js
git status

# 4) Preflight đầy đủ (app + smoke)
npm run preflight

# 5) Parity giống CI (HEAD sync — phải pass sau khi đã commit lib)
set CI=true
npm run functions:verify-bundle
set CI=

# 6) Preflight có Functions (đường release)
npm run preflight:with-functions

# 7) Trust static
npm run trust:preflight

# 8) Advisory commercial (log checklist)
npm run preflight:commercial

# 9) Trust-live → tạo stamp (cần backend + token thật — xem B3)
set TRUST_SMOKE_BACKEND_BASE=<URL Cloud Functions, không slash cuối>
set TRUST_SMOKE_ID_TOKEN=<Firebase ID JWT>
rem Tùy chọn nếu enforce App Check:
set TRUST_SMOKE_APP_CHECK=<JWT App Check>
npm run trust:live

# 10) Strict commercial candidate (sau khi có .trust-live-stamp hoặc waiver)
npm run preflight:commercial:strict
rem Hoặc waiver (chỉ khi có lý do ghi trong ticket):
rem set COMMERCIAL_GATE_ALLOW_NO_TRUST_LIVE_STAMP=I_UNDERSTAND

# 11) Receipt harness (staging, có walletOps)
set TRUST_SMOKE_BACKEND_BASE=<cùng base>
set TRUST_SMOKE_ID_TOKEN=<cùng user wallet>
npm run verify:receipt
rem Nếu server bật WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1 — kỳ vọng exit 2 + JSON 409; sau đó:
rem set GOOGLE_APPLICATION_CREDENTIALS=<path service account>
rem set VERIFY_RECEIPT_FIREBASE_UID=<uid chủ ví>
node scripts/verify-receipt-strictness.mjs seeded-flow
```

*(Trên Linux/macOS thay `set` bằng `export`.)*

### B2 — CI (GitHub Actions)

- Push nhánh lên remote; workflow **Release Discipline** (`.github/workflows/release-discipline.yml`) chạy `npm run ci:release-discipline` với `CI=true`.
- **Artifact:** log job xanh, đặt tên run (SHA commit).

### B3 — Biến môi trường thường dùng

| Biến | Mục đích |
|------|----------|
| `TRUST_SMOKE_BACKEND_BASE` / `EXPO_PUBLIC_BACKEND_API_BASE` | Base URL `walletOps` |
| `TRUST_SMOKE_ID_TOKEN` | Bearer Firebase |
| `TRUST_SMOKE_APP_CHECK` | Khi Functions `FIREBASE_APP_CHECK_ENFORCE=1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Admin seed receipt / `seeded-flow` |
| `VERIFY_RECEIPT_FIREBASE_UID` | UID khớp chủ ví test |
| `COMMERCIAL_GATE_ALLOW_NO_TRUST_LIVE_STAMP=I_UNDERSTAND` | Chỉ khi cố tình bỏ qua stamp (ghi rõ lý do) |

---

## C. Checklist thu chứng cứ (map FAIL → artifact)

| FAIL đã audit | Lệnh / run | Output / artifact kỳ vọng | Lưu gì |
|---------------|------------|----------------------------|--------|
| `functions/lib` vs HEAD (CI) | `CI=true npm run functions:verify-bundle` | `[verify-functions-bundle] OK` + không fail HEAD | Đoạn log terminal hoặc CI step log |
| CI release-discipline | Workflow job PASS | `ci:release-discipline` success | Export log GitHub Actions |
| Advisory `preflight:commercial` | `npm run preflight:commercial` | In checklist + exit 0 | Log |
| Strict commercial | `npm run preflight:commercial:strict` | Strict block OK + exit 0 | Log |
| Trust-live stamp | `npm run trust:live` | Tạo `.trust-live-stamp` | File stamp + log `trust:live` |
| `verify:receipt` | `npm run verify:receipt` | JSON dòng + exit 0 hoặc 2 (strict ON) + hướng dẫn seeded | Log stdout |
| `seeded-flow` | `node scripts/verify-receipt-strictness.mjs seeded-flow` | `OK: seeded receipt → topup → duplicate` exit 0 | Log stdout |
| Gói cuối | Đính kèm vào `docs/WAVE1_CLOSURE_EVIDENCE.md` hoặc ticket | Bảng tick đủ + link SHA commit | PR mô tả / release record |

---

## D. Không thể “giả” bằng code (bắt buộc runtime thật)

- URL `walletOps` + ID token + (nếu có) App Check token thật.
- Firestore/Admin để seed receipt (môi trường được phép ghi test).
- GitHub Actions chạy trên remote với commit đã push.
- `.trust-live-stamp` chỉ có ý nghĩa nếu `trust:live` đã gọi backend thật.

---

## E. Thứ tự tối thiểu hóa rework

1. Commit đủ file tooling/docs/scripts (mục A).  
2. `functions` build + commit `functions/lib` nếu cần.  
3. Local: `npm run preflight` → `CI=true npm run functions:verify-bundle`.  
4. Push → thu log CI.  
5. `trust:live` → stamp.  
6. `preflight:commercial` (advisory) → log.  
7. `preflight:commercial:strict` → log.  
8. `verify:receipt` → `seeded-flow` (nếu strict ON).  
9. Điền bằng chứng vào ticket / PR theo mục C.

---

## F. Trạng thái “sẵn sàng chạy ops closure”

Đánh giá tại thời điểm commit hiện tại:

- **READY TO EXECUTE WAVE 1 OPERATIONS CLOSURE** — khi mọi file trong mục A đã **tracked và trên nhánh ứng viên**, dependency có thể `npm ci`, và không còn lỗi preflight local trước bước trust/receipt.  
- **NOT READY** — nếu script/doc closure chưa trong git, hoặc `npm run preflight` / `CI=true verify-bundle` vẫn đỏ trước khi làm ops.

*(Cập nhật mục F sau khi team commit; không thay bằng “PASS” cho đến khi có đủ artifact mục C.)*
