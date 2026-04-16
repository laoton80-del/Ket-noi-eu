# Wave 1 closure — PASS/FAIL evidence map (binary audit)

**Governance:** Wave 1 thuộc **W1** theo `docs/GLOBAL_V1_PROJECT_RULES_CURSOR.md` / `docs/GLOBAL_V1_MASTER_BLUEPRINT_VI.md`. **W0 không PASS** nếu P0 chưa ký hoặc P7 chưa được ghi nhận trong P0 đã thực thi — xem `docs/P0_DECISION_MEMO.md`. **Không** coi wave sau là đóng nếu W0/W1 còn blocker mở.

Use this table to attach **command output** or **CI logs** per item. No output ⇒ item **FAIL** for Wave 1 PASS.

**Operational runbook (commands, env, artifact, thứ tự):** `docs/WAVE1_OPERATIONS_CLOSURE_RUNBOOK.md`

**Note:** The standalone Next.js marketing site is **intentionally not** in this repo anymore (mobile + Functions focus). Historical closure runs may still reference `typecheck:web` / `apps/web` on older commits.

| ID | Requirement | Command / artifact | Expected pass signal |
|----|-------------|--------------------|----------------------|
| W1-12 | Root typecheck (Expo) | `npm run typecheck` | Exit 0 |
| W1-12 | Release smoke | `npm run smoke` | `[release-smoke] OK` |
| W1-12 | Full preflight | `npm run preflight` | All steps exit 0 |
| W1-01/02 | Functions bundle + HEAD parity (local, clean tree) | `npm run functions:verify-bundle` | `[verify-functions-bundle] OK` (after committing `functions/lib` if build changed it) |
| W1-01/02 | CI parity (GitHub) | Workflow “Release Discipline” job log | `ci:release-discipline` success; verify step runs with `CI=true` |
| W1-08 | Advisory gate (informational) | `npm run preflight:commercial` | Prints checklist + exits 0 after `preflight:release` |
| W1-08 | **Strict** commercial candidate gate | `npm run preflight:commercial:strict` | Trust stamp (or documented waiver), native strict OK, `functions:verify-bundle` with HEAD sync OK |
| W1-04 | Receipt harness — strict OFF (duplicate) | `TRUST_SMOKE_BACKEND_BASE=... TRUST_SMOKE_ID_TOKEN=... npm run verify:receipt` | JSON lines + `OK: receipt strict OFF; duplicate...` exit 0 |
| W1-04 | Receipt harness — strict ON (missing) | Same env, server has `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` | JSON `missing_receipt_denied` or auto exits 2 with 409 evidence |
| W1-04 | Receipt harness — full path (staging + Admin) | `node scripts/verify-receipt-strictness.mjs seeded-flow` with `GOOGLE_APPLICATION_CREDENTIALS`, `VERIFY_RECEIPT_FIREBASE_UID` | `OK: seeded receipt → topup → duplicate` exit 0 |
| W1-07 | Trust preflight anchors | `npm run trust:preflight` | `[trust-preflight] OK` |

## Ops-only (cannot close by code alone)

- Deployed Firebase project with real `walletOps` URL and test user token.
- Optional: `.trust-live-stamp` from `npm run trust:live` for strict commercial gate.

## Wave 1 PASS rule

**PASS** only if every **automatable** row above has evidence on the release candidate commit, and no P0 open items remain in the closure audit — và **W0** (GLOBAL_V1 + P0 ký + P7 ghi nhận theo `docs/P0_DECISION_MEMO.md`) không còn blocker mở theo định nghĩa chương trình.

**Repo vs runtime:** Bảng trên chỉ định nghĩa **yêu cầu** và lệnh; **PASS** đòi hỏi **artifact thật** (stdout, log CI, stamp được phép waiver có ticket). Không có output đính kèm ⇒ mục đó **FAIL** cho mục đích đóng Wave 1.

## Runtime evidence — phiên W1 mới nhất (báo cáo vận hành thật)

Bảng dưới phản ánh **bằng chứng runtime** từ session gần nhất (stdout / quan sát operator). **Không** thay thế việc đính kèm log đỏacted đầy đủ vào RC nếu board yêu cầu.

| Kiểm tra | Kết quả | Ghi chú |
|----------|---------|--------|
| **`npm run trust:live`** (`scripts/trust-live-smoke.mjs`) | **Chưa đóng toàn bộ** | **walletOps** HTTP **200**, ledger đọc được. **b2bStaffQueueSnapshot** HTTP **403** — chấp nhận theo runbook (success hoặc từ chối claim/App Check). **aiProxy** HTTP **500** với JSON `{"ok":false,"error":"proxy_error"}` — **trust:live không coi là PASS** cho tới khi aiProxy đạt 200 hoặc 4xx có cấu trúc theo smoke (không phải 500 `proxy_error`). |
| **`verify:receipt` / strict ON (missing)** | **Đã chứng minh** | Thiếu receipt → HTTP **409**, lỗi dạng `payment_receipt_missing` / nhánh strict ON — **receipt strict ON** được chứng minh trên backend thật. |
| **`seeded-flow`** (`verify-receipt-strictness.mjs`) | **Đã chứng minh** | Bước seed receipt thành công; bước **`seeded_success_and_duplicate`** thành công — **seed → topup → replay trùng** được chứng minh. |
| **Công cụ (Windows / Node)** | **Ghi nhận, không xóa bằng chứng** | Sau output thành công có thể xuất hiện assertion kiểu `UV_HANDLE_CLOSING` (libuv teardown). **Coi là nhiễu thoát process sau thành công** cho tới khi có bằng chứng ngược từ repo/CI; **không** dùng để phủ nhận kết quả seeded ở trên. |

**Kết luận governance:** W1-04 (receipt) có thêm **bằng chứng thật** cho strict ON + seeded path; **`trust:live` / con dấu optional** vẫn **mở** vì **aiProxy** chưa đạt tiêu chí smoke.

### Mẫu cập nhật evidence (trust:live / aiProxy)

Sau mỗi phiên `npm run trust:live` + (khuyến nghị) tra Cloud Logging, **sao chép khung** trong **`docs/WAVE1_OPERATIONS_CLOSURE_RUNBOOK.md` § B3b** (“Mẫu điền evidence”) vào ticket / PR hoặc bảng nội bộ. **Chỉ** sửa bảng “Runtime evidence — phiên W1” phía trên khi có **stdout + finding mới**; **không** đánh dấu PASS hoặc xóa dòng lịch sử chỉ vì cập nhật doc — cần bằng chứng chạy lại smoke.

### Neo kỹ thuật từ repo (W1 evidence — không thay thế log GCP)

*(Căn cứ mã trong repo tại thời điểm audit; không chứng minh trạng thái secret/deploy thật trên GCP.)*

- **`proxy_error`:** Trong `functions/src/index.ts`, phản hồi **HTTP 500** với `{ "ok": false, "error": "proxy_error" }` đến từ **`catch`** sau khi các cổng **App Check** và (nếu bật) **Firebase bearer** đã xử lý. Nhánh smoke dùng `op: 'chat'` → lỗi thường gắn **`proxyChat`** trong `functions/src/openaiProxy.ts` (ví dụ thiếu / sai **`OPENAI_API_KEY`**, OpenAI upstream trả non-OK, hoặc lỗi mạng khi gọi API).
- **Không** quy kết “lỗi token người dùng” chỉ vì thấy `proxy_error`, nếu bằng chứng session cho thấy **walletOps 200** và smoke đã tới được `aiProxy` (tức trust gate cơ bản không chặn toàn bộ).
- **Bước tiếp theo tối thiểu (external / manual):** Trên **revision Functions thật** đang phục vụ `POST …/aiProxy`, xác minh secret **`OPENAI_API_KEY`** (Secret Manager / biến môi trường deploy) và **Cloud Logging** tìm **`[aiProxy] error`** để có stack/nguyên nhân. Triển khai lại **từ source** theo pipeline dự án (ví dụ `firebase deploy --only functions:aiProxy`) nếu có nghi ngờ revision/artifact lệch — **không** thay đổi doc thành “DONE” khi chưa có stdout `trust:live` PASS mới.
- Chi tiết điều hành bổ sung: `docs/P4_EXECUTION_BOARD.md` § **trust:live vs aiProxy (mở)**.
