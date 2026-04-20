# KẾT NỐI GLOBAL — PROGRAM CLOSURE TRACKER

Tracker này theo dõi công việc **đóng ngoài repo / thủ công** sau khi phần **củng cố phía repo** đã gần hoàn tất. Mức **10/10 global production thương mại** chỉ hợp lệ khi **cả** repo-side **và** các blocker external/manual bắt buộc đều đã được đóng.

## Quy ước trạng thái

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `DONE`

## Path P0 / P7 trên nhánh repo

`docs/P0_DECISION_MEMO.md` và `docs/P7_B2B_OPERATIONAL_SURFACE_DECISION.md` hiện là **bản nháp / placeholder** — **không có hiệu lực** — cho tới khi các mục **E1** và **E2** dưới đây hoàn tất theo đúng điều kiện trong bảng. **E1** và **E2** đang **NOT STARTED** nghĩa là **chưa** có memo hay quyết định P7 đã chốt trong repo theo nghĩa gate; không suy ra đã có bản có hiệu lực chỉ vì đường dẫn tồn tại.

---

## A. Decision Gates

| ID | Hạng mục | Trạng thái | Điều kiện DONE | Bằng chứng cần lưu | Owner | Ghi chú |
|---|---|---|---|---|---|---|
| E1 | Ký `docs/P0_DECISION_MEMO.md` | NOT STARTED | Memo có ngày hiệu lực, người ký, phiên bản chốt | Bản ký + commit/doc chốt trong repo | | |
| E2 | Chốt P7 | NOT STARTED | Ghi rõ A (mobile-only) hoặc B (parity web/mobile) trong tài liệu quyết định đã chốt | Trích đoạn P7 trong P0 hoặc phụ lục có link | | Phụ thuộc E1 |

---

## B. W1 Runtime / Trust / Money Evidence

| ID | Hạng mục | Trạng thái | Điều kiện DONE | Bằng chứng cần lưu | Owner | Ghi chú |
|---|---|---|---|---|---|---|
| E3 | Chuẩn bị env runtime thật | IN PROGRESS | `TRUST_SMOKE_BACKEND_BASE`, `TRUST_SMOKE_ID_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS` trỏ đúng môi trường thật và chạy được smoke tối thiểu | Ghi chú nội bộ (không commit secret) hoặc checklist đã tick | | Không public secrets |
| E4 | Chạy `trust:live` thật | IN PROGRESS | Lệnh chạy trên backend thật; **tất cả** mục trong `trust-live-smoke` OK (kể cả aiProxy) và khớp runbook | Log terminal hoặc artifact lưu nội bộ | | **Session mới nhất:** walletOps OK, b2b 403 chấp nhận; **aiProxy 500 `proxy_error` → chưa DONE** — xem `docs/WAVE1_CLOSURE_EVIDENCE.md` §Runtime evidence. **Chỉ chuyển E4 → DONE khi có stdout `trust:live` PASS mới** (không đổi status chỉ từ doc); mẫu điền evidence: `docs/WAVE1_OPERATIONS_CLOSURE_RUNBOOK.md` §B3b. |
| E5 | Chạy `verify:receipt` thật | IN PROGRESS | Strictness/receipt flow đúng theo tài liệu vận hành; **đã có** bằng chứng strict ON (missing → 409) | Log terminal / export CI | | **409 `payment_receipt_missing` đã chứng minh strict ON** — `docs/WAVE1_CLOSURE_EVIDENCE.md` |
| E6 | Chạy `seeded-flow` thật | DONE | Receipt seed, topup, xử lý trùng lặp đều có log chứng minh | Log terminal / artifact | | **Session mới nhất:** seed + `seeded_success_and_duplicate` OK; ghi nhận có thể có assertion Windows/libuv sau success (teardown) — không xóa bằng chứng seeded |
| E7 | CI evidence thật | NOT STARTED | Có job CI (hoặc export log) cho release discipline / bundle parity / preflight theo quy ước dự án | Link job hoặc file log đính kèm | | Không chỉ pass máy local |

---

## C. Commercial E2E Outside Repo

| ID | Hạng mục | Trạng thái | Điều kiện DONE | Bằng chứng cần lưu | Owner | Ghi chú |
|---|---|---|---|---|---|---|
| E8 | Xác nhận payments service spec thật | NOT STARTED | Spec chốt: payload intent/verify, `comboId` vs pack id, mapping amount fiat ↔ credits | Tài liệu kỹ thuật / OpenAPI / note chốt phiên bản | | Ngoài monorepo app |
| E9 | Đối chiếu E2E thương mại | NOT STARTED | Một lượt đi thật: hiển thị → intent → verify → `walletOps` → receipt khớp nhau | Bảng testcase + log/screenshot theo từng bước | | Phụ thuộc E8 |

---

## D. Legal / Support / Public Surface

| ID | Hạng mục | Trạng thái | Điều kiện DONE | Bằng chứng cần lưu | Owner | Ghi chú |
|---|---|---|---|---|---|---|
| E10 | Privacy / Terms thật | NOT STARTED | URL công khai, nội dung cuối cùng, không placeholder | URL + snapshot ngày chốt | | |
| E11 | Support email thật | NOT STARTED | Hộp thư hoạt động, có người nhận | Mail thử nghiệm hoặc xác nhận IT | | Cập nhật config sau khi chốt |
| E12 | Domain / website thật | IN PROGRESS | Domain trỏ đúng, site tối thiểu public (theo phạm vi P7) | URL live + ngày kiểm tra | | |

---

## E. Store / Identity / Publishing

| ID | Hạng mục | Trạng thái | Điều kiện DONE | Bằng chứng cần lưu | Owner | Ghi chú |
|---|---|---|---|---|---|---|
| E13 | Apple Developer enrollment | IN PROGRESS | Tài khoản membership active, không còn bước enroll dở dang | Email Apple / screenshot tài khoản (nội bộ) | | |
| E14 | Google/Play publishing path | NOT STARTED | Có quyền Play Console và quy trình publish rõ | Screenshot console hoặc runbook nội bộ | | Nếu phát hành Android |
| E15 | Quyết định migration identity ngoài store | NOT STARTED | Chốt tên app, slug, bundle id, đường brand công khai | Decision note / ticket chốt | | |

---

## F. Final Closure

| ID | Hạng mục | Trạng thái | Điều kiện DONE | Bằng chứng cần lưu | Owner | Ghi chú |
|---|---|---|---|---|---|---|
| E16 | Final commercial hardening audit | NOT STARTED | Audit cuối chỉ chạy khi các mục E1–E15 đã đủ theo kế hoạch | Báo cáo audit đã lưu | | |

---

## Tổng quan hiện tại

| Cụm | Trạng thái |
|---|---|
| Repo-side hardening | Gần xong |
| P0 / P7 | Chưa xong |
| W1 runtime evidence thật | **Một phần** — receipt strict ON + seeded-flow có bằng chứng; **trust:live full PASS mở** (aiProxy 500) |
| Payments E2E ngoài repo | Chưa xong |
| Legal / support / site / store | Chưa xong |

---

## Thứ tự ưu tiên làm ngay

| Ưu tiên | Hạng mục |
|---|---|
| 1 | E1 — Ký P0 |
| 2 | E2 — Chốt P7 |
| 3 | E3–E7 — Đóng W1 runtime evidence thật |
| 4 | E8–E9 — Chốt payments spec và E2E thương mại |
| 5 | E10–E15 — Legal / support / site / store |
| 6 | E16 — Final commercial hardening audit |

---

## Log cập nhật

| Ngày | Mục | Cập nhật | Người cập nhật |
|---|---|---|---|
| 2026-04-10 | E4–E6 / W1 | Runtime: `verify:receipt` strict ON (409 missing), `seeded-flow` + duplicate OK; `trust:live` partial — aiProxy 500 `proxy_error` → không đóng trust:live. Ghi nhận assertion Windows/libuv có thể là noise sau success. | |
| 2026-04-14 | E4 / W1 doc | Audit repo: `proxy_error` được emit từ `catch` sau trust gates trong `functions/src/index.ts` (neo `openaiProxy`). Bổ sung mục neo kỹ thuật + bước tối thiểu (Logging / OPENAI_API_KEY / redeploy) trong `docs/WAVE1_CLOSURE_EVIDENCE.md` và `docs/P4_EXECUTION_BOARD.md` — **không** tuyên bố trust:live DONE; vẫn cần bằng chứng chạy lại smoke. | |
| 2026-04-14 | E4 / runbook | Doc-only: thêm `docs/WAVE1_OPERATIONS_CLOSURE_RUNBOOK.md` §B3b (Cloud Logging checklist, xác minh ngoài repo, mẫu evidence); liên kết từ `WAVE1_CLOSURE_EVIDENCE`, `P4`, ghi chú E4 tracker — **không** đổi trạng thái E4. | |
| | | | |
