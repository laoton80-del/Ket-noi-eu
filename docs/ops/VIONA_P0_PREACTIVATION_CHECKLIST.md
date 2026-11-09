# VIONA P0 — danh sách kiểm tra trước khi bật Cost Governor

Tài liệu cho Operator. Không bật Cost Governor, không seed giá, không chạy migration, không đổi runtime.

Baseline đã đọc: `492efc9601a00bb51de082e0b6aba110a4219a03` trên `candidate/p0-doc-checklist`.
Cập nhật lần cuối: 2026-11-07.

Mỗi mục có ID, việc cần làm, chủ, trạng thái, điều kiện hoàn tất, và nguồn trong repo khi xác minh được. Cụm `chưa xác minh trong repo` nghĩa là commit này không có căn cứ cho điểm đó.

## Bảng

| ID | Việc | Chủ | Trạng thái |
| --- | --- | --- | --- |
| A1-TXTIMEOUT | timeout có biên an toàn; maxWait tường minh | Codex | OPEN |
| A1-PRICE-SEED | Giá và timeout provider do Operator xác minh | Operator | OPEN |
| A1-AUTHORITY-RPC | Code RPC cho authority | chưa phân công | OPEN |
| A1-RECON | Đối soát DISPATCHING và RESERVED mồ côi | Claude + Operator ký | OPEN |
| A1-ENV | Sáu biến VIONA_COST_GOVERNOR_* chỉ sau A1-RECON | chưa phân công | OPEN |
| A1-MIGRATION-SNAPSHOT | Migration snapshot chỉ khi bảng rỗng | chưa phân công | OPEN |
| WALLET-RECEIPT | Sau deploy, biến receipt bằng 1 | Operator | OPEN |
| PROVIDER-SPEND-CAPS | Hạn mức chi và cảnh báo ở nhà cung cấp | Operator | OPEN |
| A1-FIREBASE | SOS miễn cap; tắt withOneRetry phía client | chưa phân công | OPEN |
| ADJACENT-MONEY | A4-STOP/A4-DEMO, A2, P0-B | chưa phân công | OPEN |
| LEONA-PHASE-DONE | Leona phase done không gọi provider | chưa phân công | OPEN |

## Chi tiết

### A1-TXTIMEOUT

- Việc: đặt `timeout` và `maxWait` tường minh cho 5 lời gọi `$transaction`. Chỉ `timeout` phải ≥ `LOCK_TIMEOUT_MS` + `STATEMENT_TIMEOUT_MS` + 5000 (biên an toàn). `maxWait` (thời gian chờ lấy kết nối) phải được đặt tường minh, không cần lớn hơn lock+statement; giá trị cuối do Operator quyết sau báo cáo A1-TXTIMEOUT.
- Chủ: Codex. Duyệt độc lập.
- Trạng thái: OPEN. Đang làm.
- Điều kiện hoàn tất: cả 5 lời gọi có `timeout` ≥ `LOCK_TIMEOUT_MS` + `STATEMENT_TIMEOUT_MS` + 5000 và có `maxWait` tường minh. Giá trị cuối của `maxWait` do Operator quyết sau báo cáo A1-TXTIMEOUT. Mục đã được duyệt độc lập.
- Nguồn: `src/services/ai/CostGovernorService.ts` có `LOCK_TIMEOUT_MS = 5_000n`, `STATEMENT_TIMEOUT_MS = 10_000n`, và 5 lời gọi `databaseProvider().$transaction` tại dòng 416, 550, 578, 647, 687. Cùng file không có `maxWait`. `docs/ops/VIONA_P0_A1_COST_GOVERNOR_ENV.md` mục Transaction lock guard nói lock năm giây và statement mười giây.

### A1-PRICE-SEED

- Việc: bảng giá và timeout provider do Operator xác minh từ nhà cung cấp. Không hard-code giá chưa kiểm.
- Chủ: Operator.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: Operator xác minh số từ nhà cung cấp trước khi một dòng giá được dùng để reserve. Giá chưa kiểm không được ghi vào code.
- Nguồn: `prisma/schema.prisma` model `AiModelPrice`. `docs/ops/VIONA_P0_A1_COST_GOVERNOR_ENV.md` mục Price history: dòng giá là phiên bản bất biến; không bịa default; reserve chụp input và output micro-USD trên mỗi triệu token. Tài liệu này không chép số ví dụ trong file env.

### A1-AUTHORITY-RPC

- Việc: viết code RPC cho authority.
- Chủ: chưa phân công.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: có code RPC authority được duyệt riêng. Tài liệu này không mô tả thiết kế RPC.
- Nguồn: tại commit baseline, tìm `cost-governor` không ra file route. Một file RPC đã có: chưa xác minh trong repo.

### A1-RECON

- Việc: đối soát các bản ghi `DISPATCHING` và `RESERVED` mồ côi. Chỉ sau review mới được bật 6 biến `VIONA_COST_GOVERNOR_*`.
- Chủ: Claude + Operator ký.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: A1-RECON được review độc lập và Operator ký, trước khi đặt đủ 6 biến ở mục A1-ENV.
- Nguồn: `docs/ops/VIONA_P0_A1_COST_GOVERNOR_ENV.md` mục Production activation condition. `DISPATCHING` và `RESERVED` có trong `src/services/ai/CostGovernorService.ts`.

### A1-ENV

- Việc: đặt đúng sáu tên dưới đây. Không tự đặt tên khác. Chỉ đặt sau khi A1-RECON hoàn tất.
- Chủ: chưa phân công.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: mục A1-RECON đã xong, và chỉ sáu tên này được đặt.
- Nguồn: bảng trong `docs/ops/VIONA_P0_A1_COST_GOVERNOR_ENV.md`:
  - `VIONA_COST_GOVERNOR_USER_DAILY_CAP_MICRO_USD`
  - `VIONA_COST_GOVERNOR_GLOBAL_DAILY_CAP_MICRO_USD`
  - `VIONA_COST_GOVERNOR_GLOBAL_MONTHLY_CAP_MICRO_USD`
  - `VIONA_COST_GOVERNOR_USER_INFLIGHT_LIMIT`
  - `VIONA_COST_GOVERNOR_GLOBAL_INFLIGHT_LIMIT`
  - `VIONA_COST_GOVERNOR_PROVIDER_TIMEOUT_MS`

### A1-MIGRATION-SNAPSHOT

- Việc: `prisma/migrations/20261105000000_ai_cost_operation_snapshots` chỉ chạy khi bảng `AiCostOperation` rỗng.
- Chủ: chưa phân công.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: kiểm tra rỗng ra không có dòng, và không có writer vào bảng, rồi mới chạy migration. Gói này không chạy câu đó và không chạy migration.
- Cách kiểm tra rỗng, chỉ mô tả: `SELECT 1 FROM "AiCostOperation" LIMIT 1`. Không có dòng trả về thì bảng rỗng. Chính migration từ chối bảng không rỗng bằng lỗi `AiCostOperation must be empty before applying snapshot columns; no backfill is defined`.
- Nguồn: `prisma/migrations/20261105000000_ai_cost_operation_snapshots/migration.sql`. Model `AiCostOperation` trong `prisma/schema.prisma` không có `@@map`. `docs/ops/VIONA_P0_A1_COST_GOVERNOR_ENV.md` mục Snapshot migration precondition.

### WALLET-RECEIPT

- Việc: sau deploy, kiểm lại `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT="1"`.
- Chủ: Operator.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: bản Functions đang chạy có biến này bằng `1`.
- Nguồn: `functions/src/index.ts` so sánh `process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` với `'1'`.

### PROVIDER-SPEND-CAPS

- Việc: Operator đặt hạn mức chi và cảnh báo ở nhà cung cấp AI.
- Chủ: Operator.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: Operator xác nhận đã đặt cap và alert tại nhà cung cấp, ngoài repo.
- Nguồn: chưa xác minh trong repo.

### A1-FIREBASE

- Việc: SOS phải được miễn cap chi phí. Vô hiệu hóa `withOneRetry` phía client vì nguy cơ tính tiền 2 lần.
- Chủ: chưa phân công.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: đường SOS không bị chặn bởi cost cap hoặc lỗi sổ, có test riêng trước khi bật; client không còn `withOneRetry` trên đường trả phí.
- Nguồn: `docs/ops/VIONA_P0_A1_COST_GOVERNOR_ENV.md` mục SOS and Firebase boundary: đường SOS/emergency không được bị cost cap hoặc lỗi sổ chặn, và rail đó cần test riêng trước khi bật. Hàm `withOneRetry` nằm trong `src/services/OpenAIService.ts`.

### ADJACENT-MONEY

- Việc: các gói tiền kề `A4-STOP` / `A4-DEMO`, `A2`, `P0-B` ở trạng thái OPEN. Không mô tả thiết kế.
- Chủ: chưa phân công.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: thuộc các gói riêng. Tài liệu này chỉ liệt kê, không chốt thiết kế.
- Nguồn đã thấy trong code, không phải thiết kế gói:
  - `src/state/wallet.ts` hàm `topupCreditsServer` gửi `amount` và `paymentEventId`, không gửi `packId` hay `idempotencyKey`. `functions/src/index.ts` nhánh `topup` yêu cầu `packId` và `idempotencyKey`.
  - `chargeTrustedService` trong `src/state/wallet.ts` gửi `amount` do client đưa. `functions/src/index.ts` đọc `body.amount`, trừ credits và ghi `applied`. Trong nhánh đó không có bước hoàn tiền.
- Tên gói `A4-STOP`, `A4-DEMO`, `A2`, `P0-B`: chưa xác minh trong repo.

### LEONA-PHASE-DONE

- Việc: giao diện Leona đặt `phase=done` mà không gọi provider.
- Chủ: chưa phân công.
- Trạng thái: OPEN.
- Điều kiện hoàn tất: không thuộc gói checklist này. Đây là rủi ro đã biết, chưa xử lý tại baseline.
- Nguồn: `src/screens/LeonaCallScreen.tsx` gọi `setPhase('done')` ngay sau khi `chargeTrustedService` thành công. Hàm đó không gọi provider. `callLeonaVoiceApi` chỉ được khai báo trong `src/services/VoiceService.ts`; không có caller trong `*.ts` hoặc `*.tsx` tại commit này.

## Điểm chưa xác minh trong repo

- A1-AUTHORITY-RPC: chưa có file RPC tại baseline.
- PROVIDER-SPEND-CAPS: không có tên biến hay tên hãng trong repo cho hạn mức nhà cung cấp.
- ADJACENT-MONEY: tên gói `A4-STOP`, `A4-DEMO`, `A2`, `P0-B` không thấy tại commit baseline.
