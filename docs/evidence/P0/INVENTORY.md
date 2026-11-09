# VIONA R0 — Capability inventory

- **Ngày:** 2026-11-02
- **Repo:** `C:\KNG\ket-noi-eu`
- **Nhánh:** `feat/viona-runtime-canon-adoption-wave1-public-copy-v1`
- **HEAD:** `3a6798d7752caf61000060f7f0401297d3f6f92a`
- **Tree:** `982965bee28858f916dc1e544887884d04e42167`
- **Working tree:** dirty (30 modified + 27 untracked tại thời điểm kiểm). File này là file mới duy nhất được tạo trong bước R0.
- **Nguồn module 63:** zip ngoài repo `C:\Users\uživatel\Downloads\viona claude\viona-spec.zip` → `viona-spec/docs/spec/INDEX.md`. **Repo không có** `docs/spec/INDEX.md`.
- **Quy tắc bằng chứng:** chỉ ghi điều thấy trong code/test/git. README/comment/báo cáo cũ = gợi ý. Không chắc = `KHÔNG RÕ`. Không dùng nhãn production/live.

## Lệnh đã chạy (kết quả thật)

| Lệnh | Kết quả |
|---|---|
| `git --no-optional-locks rev-parse --show-toplevel / HEAD / branch / status` | root `C:\KNG\ket-noi-eu`; HEAD như trên; dirty |
| `npx --no-install prisma validate` | **PASS** — schema hợp lệ. Prisma CLI in `Environment variables loaded from .env` (không đọc/in giá trị) |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` | **PASS** — 0 `error TS` (~25s). Không chạy `npm run typecheck` vì script đó gọi `prisma generate` (ghi file) |
| `npx --no-install tsx scripts/test-local-create-failure-code-envelope.ts` | **PASS** — E1–E6 |
| `npx --no-install tsx scripts/test-local-provider-eligibility-schema-domain.ts` | **PASS** — cases 1–29 |
| `npx --no-install tsx scripts/test-viona-pack40d1-execution-attempt-schema.ts` | **PASS** — 47 |
| `npx --no-install tsx scripts/test-tourism-timeout-release-eligibility.ts` | **PASS** |
| `npx tsc --noEmit` (batch sau, `%TEMP%\viona-r0`) | **PASS** — exit 0, ~42s |
| `npm run lint` (`expo lint`, `CI=1`) | **PASS** exit 0 — **0 errors, 191 warnings**. Expo nạp `.env.local` và `.env` (có secret ở các file đó; không chép giá trị). Ghi cache ESLint dưới `.expo/` |
| Guarded batch 72 script (`%TEMP%\viona-r0\results.csv`) | Lần 1 runner fail (PowerShell ArgumentList). Lần 3: **68 PASS / 4 FAIL**. FAIL: `test-local-safe-i18n-copy-pass.ts`; `test-viona-mobile-sos-shell-consolidation-phase-1.ts` (1 failure); `test-viona-modern-home-shell-mode-resolver-foundation.ts` (1 failure); `test-viona-rec2-home-shell-contract.ts` (universe descriptions no line cap/ellipsis) |
| `scripts/test-*.ts` còn lại (~25+ file, gồm pack39) | **KHÔNG CHẠY** trong batch — không nằm trong run-list |

Không deploy, không gọi API/provider thật, không migration DB, không đọc giá trị secret. Lint/batch đã nạp file env local (tên biến xuất hiện trong log lint; giá trị không đưa vào báo cáo).

---

## 1. Cấu trúc repo

**Ngôn ngữ / framework:** TypeScript ~5.9; Expo ~54 (React Native) + Express 5 API (`src/server.ts`); Prisma 6; Firebase Functions (`functions/`); Stripe; OpenAI SDK.

**Thư mục cấp 1 (không kể `node_modules`):** `src/`, `scripts/` (~97 `test-*.ts` + 5 `test-*.mjs`), `prisma/`, `docs/` (~40 mục cấp 1, rất nhiều evidence pack), `functions/`, `assets/`, `android/`, `ios/`, `supabase/`, `.github/workflows/`, `dist/`, `qa-screenshots/`. File gốc: `App.tsx`, `package.json` (`name`: `ket-noi-global`), `fly.toml`, `vercel.json`, `firebase.json`, `AGENTS.md`.

**`src/` cấp 2:** `screens/`, `services/`, `controllers/`, `routes/`, `domain/`, `lib/`, `core/`, `components/`, `navigation/`, `config/`, `middleware/`, `workers/`, `i18n/`, `design/`, … (~39 mục).

**Chạy test:** không có script `test` tổng. Từng file: `tsx scripts/test-<tên>.ts` hoặc `npm run test:<tên>` (một số ít được khai trong `package.json`). Typecheck đầy đủ theo package: `npm run typecheck` = `prisma generate && tsc --noEmit` — **không dùng ở R0**.

**CI:** `.github/workflows/release-discipline.yml` (PR/push `main`: `npm ci`, Firebase config từ GitHub secrets, `npm run ci:release-discipline`); thêm `viona-merge-authorization-gate.yml` và `viona-merge-explicit-authorization.yml` (file gate đang dirty).

---

## 2. Bảng 63 module (INDEX.zip)

Cột “Có code?” = file nguồn khớp **năng lực mô tả của module**, không phải màn hình cùng universe. “Có test?” = script test khớp năng lực đó. Test không chạy thì không ghi PASS.

| Module | Có code? | Đường dẫn | Có test? | Test pass? | Mức đề xuất | Ghi chú |
|---|---|---|---|---|---|---|
| BU-01 POS & bếp | Không | — | Không | — | KHÔNG CÓ | Không thấy KDS/cân/barcode POS. `OrdersScreen` / `MerchantCatalogTabScreen` là B2B generic |
| BU-02 Salon | Không | — | Không | — | KHÔNG CÓ | Không thấy split-tip / xoay tua / vật tư. Có chat salon persona (`AIEngine`) — không đủ BU-02 |
| BU-03 Grocery | Không | — | Không | — | KHÔNG CÓ | |
| BU-04 Xếp ca | Một phần | `src/services/b2b/PayrollService.ts`, `src/screens/b2b/SmartCalendarScreen.tsx` | Không thấy test module | — | CODE-CHƯA-TEST | Payroll/calendar; không thấy chấm công GPS/khuôn mặt |
| BU-05 SEO/reputation | Một phần | `src/services/marketing/AIPostGenerator.ts`, `AutoPoster.ts`, `AdContentGenerator.ts` | Không thấy test Google/TripAdvisor | — | CODE-CHƯA-TEST | Soạn/đăng marketing; không thấy quét review ngoài |
| BU-06 Logistics XB | Không | — | Không | — | KHÔNG CÓ | Tier 4 GATED trong INDEX |
| BU-07 Franchise/thuê | Không | — | Không | — | KHÔNG CÓ | |
| BU-08 Lễ tân thoại | Có | `src/services/ai/VoiceReceptionistService.ts`, `voiceReceptionistB2bDemo.ts`, `src/screens/b2b/AiReceptionist*.tsx`, `src/core/telephony/telephonyPilotRegistry.ts` | Có pack Twilio/circuit-breaker (không chạy R0) | KHÔNG CHẠY | CODE-CHƯA-TEST | Registry: `docsOnly` / `productionReady: false` |
| BU-09 Dự báo chiến lược | Không | — | Không | — | KHÔNG CÓ | |
| BU-10 Đàm phán nguồn | Không | — | Không | — | KHÔNG CÓ | |
| BU-11 AR storefront | Không | — | Không | — | KHÔNG CÓ | |
| BU-12 Thanh tra thuế DN | Một phần | `src/screens/vault/TaxCopilotScreen.tsx` | Không | — | DESIGNED | UI mock payslip; không phải hồ sơ thanh tra |
| BU-13 GDPR/privacy | Một phần | `scripts/test-viona-pack33-global-compliance.ts` + code pack33 (không đọc hết) | Có script pack33 | KHÔNG CHẠY | CODE-CHƯA-TEST | KHÔNG RÕ độ phủ xóa/retention |
| BU-14 Năng lượng | Không | — | Không | — | KHÔNG CÓ | |
| TR-01 Visa/di trú | Không | `src/screens/TienIchScreen.tsx` (list chuyên gia hardcode) | Không | — | DESIGNED | Affiliate copy; không có luồng tờ khai |
| TR-02 Hoàn VAT | Một phần | `TaxCopilotScreen.tsx` (`onGenerateRefundDraft` Alert) | Không | — | DESIGNED | Stub UI |
| TR-03 Phiên dịch live | Có | `src/screens/LiveInterpreterScreen.tsx`, `src/services/liveInterpreterService.ts`, `src/services/ai/MinhKhangService.ts` | Không thấy test interpreter | — | CODE-CHƯA-TEST | Telephony registry: `liveInterpreterVoiceBridge` `productionFrozen` |
| TR-04 Liên phương tiện | Một phần | `src/screens/b2c/travel/FlightSearchScreen.tsx`, `src/services/travel/FlightApiService.ts` | Không | — | CODE-CHƯA-TEST | Máy bay; không thấy tàu/bus liên vận |
| TR-05 Pet travel | Không | — | Không | — | KHÔNG CÓ | |
| TR-06 Booking/GDS/tour | Có | `prisma` `TourismBooking`/`TourismService`; `TourismCheckoutScreen.tsx`; `src/services/tourism/*`; inbox merchant | `scripts/test-tourism-timeout-release-eligibility.ts` (+ cancel/confirm scripts, không chạy hết) | **PASS** (đúng 1 script timeout classifier) | RUNTIME-PASS(tourism timeout eligibility classifier) | Không thấy GDS. `Booking` salon/generic tách bảng |
| TR-07 Swarm routing | Không | — | Không | — | KHÔNG CÓ | |
| TR-08 AR guide | Không | — | Không | — | KHÔNG CÓ | |
| TR-09 Hành lý | Không | — | Không | — | KHÔNG CÓ | |
| TR-10 Carbon | Không | — | Không | — | KHÔNG CÓ | |
| AC-01 Luyện thi nghề | Có | `src/screens/learning/AdultLearningHome.tsx`, `src/components/learning/adult/*`, `AcademyScreen.tsx` | `scripts/test-viona-adult-learning-cards-a11y-contract.ts` (untracked) | KHÔNG CHẠY | CODE-CHƯA-TEST | File Academy đang dirty |
| AC-02 Tiếng Việt F2/F3 | Có | `src/screens/b2c/academy/VietKidsScreen.tsx`, `src/services/learning/KidsLearningEngine.ts`, `src/services/academy/*` | Không thấy test năng lực ngôn ngữ | — | CODE-CHƯA-TEST | Kids mode + thưởng VIG (`EducationService.ts`) |
| AC-03 Chợ tri thức | Không | — | Không | — | KHÔNG CÓ | |
| AC-04 Dịch bằng cấp | Một phần | `src/services/selling/sellResumeStorage.ts` | Không | — | DESIGNED | Lưu resume; không phải hợp pháp hóa EU |
| AC-05 Bio-sync | Không | — | Không | — | KHÔNG CÓ | |
| AC-06 Giáo án | Một phần | `src/screens/learning/AiTeacherScreen.tsx`, `src/screens/academy/LiveAiTeacherScreen.tsx` | Không | — | CODE-CHƯA-TEST | Giáo viên AI; không thấy kiến trúc giáo án đủ AC-06 |
| AC-07 VR nghề | Không | — | Không | — | KHÔNG CÓ | |
| AC-08 Gia phả | Không | — | Không | — | KHÔNG CÓ | |
| AC-09 Skill-to-job | Không | `TienIchScreen.tsx` listing việc hardcode | Không | — | DESIGNED | |
| LO-01 Giấy tờ HC | Một phần | `TienIchScreen.tsx` (`legal` affiliate) | Không | — | DESIGNED | Không thấy navigator thủ tục |
| LO-02 Nhà ở cộng đồng | Một phần | `TienIchScreen.tsx` (`housing`) | Không | — | DESIGNED | |
| LO-03 Thợ on-demand | Có | `src/screens/b2c/LocalScreen.tsx`; `src/domain/local/lo03/`; `src/services/local/*`; `LocalServiceRequest` Prisma | Nhiều `scripts/test-local-*` | **PASS** envelope E1–E6 + eligibility 1–29 | RUNTIME-PASS(local-create failure-code envelope; provider eligibility schema-domain) | ID `LO-03` xuất hiện trong source. Dirty: `lo03DraftToRequestAdapter.ts` untracked |
| LO-04 Telehealth | Không | — | Không | — | KHÔNG CÓ | |
| LO-05 Partner Economy | Một phần | `src/screens/b2c/travel/FixerEarningsScreen.tsx`, `localFixerCatalog.ts`, `LocalFixerScreen.tsx` | Không thấy test ô CZ-Praha × LO-05E | — | CODE-CHƯA-TEST | Fixer/earnings; không thấy gate work-rights/payout đủ LO-05 |
| LO-06 Lifestyle orchestrator | Một phần | `src/screens/LifeOSDashboard.tsx`, `src/lifeOS/` | Không | — | CODE-CHƯA-TEST | LifeOS; KHÔNG RÕ khớp LO-06 spec |
| LO-07 Smart home | Không | — | Không | — | KHÔNG CÓ | |
| LO-08 Robot/drone | Không | — | Không | — | KHÔNG CÓ | |
| LO-09 Social trust | Không | — | Không | — | KHÔNG CÓ | |
| LO-10 EV charging | Không | — | Không | — | KHÔNG CÓ | |
| AT-01 Kiều hối | Không | `TienIchScreen.tsx` id `exchange` | Không | — | DESIGNED | Copy affiliate |
| AT-02 Thuế XB | Một phần | `TaxCopilotScreen.tsx` | Không | — | DESIGNED | Checklist/mock; không filing (đúng hướng D-select) nhưng chưa có luồng |
| AT-03 Chỉ số tin cậy | Không | `src/services/admin/AutoFraudEngine.ts` (mock payout) | Không | — | DESIGNED | Không phải AT-03 |
| AT-04 Quỹ gia đình | Một phần | Prisma `PiggyBank`, `CharityFund`; `EducationService.ts` | Không | — | CODE-CHƯA-TEST | Piggy/charity ≠ family fund spec |
| AT-05 Payment đa tenant | Một phần | `WalletService.ts`, Stripe routes, `VionaRequestEscrowHold`, `ProcessedStripeEvent` | `test:payments-mapper` (không chạy) | — | CODE-CHƯA-TEST | Wallet/Stripe/escrow có; không thấy AT-05 multi-tenant gateway đủ nghĩa INDEX. Manifest zip: tiền đề, chưa ký |
| AT-06 Két thừa kế | Một phần | `src/screens/VaultScreen.tsx`, Prisma `SecureVault` | Không | — | CODE-CHƯA-TEST | Vault tài liệu; KHÔNG RÕ thừa kế |
| AT-07 Scam shield | Một phần | `AutoFraudEngine.ts` | Không | — | DESIGNED | Header: “Mock AI fraud” |
| AT-08 Đầu tư nhỏ | Một phần | `src/screens/commercial/AngelInvestmentHub.tsx` | Không | — | DESIGNED | |
| AT-09 Crypto/fiat | Không | Kernel/Blueprint loại trừ crypto (gợi ý docs, không phải code module) | — | — | KHÔNG CÓ | |
| AT-10 Gọi vốn | Một phần | `AngelInvestmentHub.tsx` | Không | — | DESIGNED | |
| SO-01 Mất hộ chiếu | Không | `EmergencySOSScreen.tsx` = ambulance/police/fire/112 | Không | — | KHÔNG CÓ | Hub SOS ≠ luồng hộ chiếu |
| SO-02 Legal khẩn | Một phần | `AIController` legal-scan mock; `documentUnderstanding.ts` | Không | — | CODE-CHƯA-TEST | Mock keyword scan; không giả luật sư — chưa phải SO-02 |
| SO-03 Beacon cộng đồng | Không | — | Không | — | KHÔNG CÓ | |
| SO-04 Tinh thần | Không | — | Không | — | KHÔNG CÓ | |
| SO-05 Bản đồ mất mạng | Không | `src/app/bootstrap/rec2OfflineHomePolicy.ts` (offline Home) | `test-viona-rec2-offline-home-boundary.ts` (không chạy) | — | KHÔNG CÓ | Offline Home ≠ SOS safe map |
| SO-06 Sinh trắc | Không | — | Không | — | KHÔNG CÓ | |
| SO-07 Liên lạc đứt hạ tầng | Không | — | Không | — | KHÔNG CÓ | |
| SO-08 Va chạm | Không | — | Không | — | KHÔNG CÓ | |
| SO-09 Deepfake/giọng | Không | — | Không | — | KHÔNG CÓ | Không thấy detector |
| SO-10 Trợ giúp kín | Một phần | `SOSModal.tsx`, `SosPlusProfileScreen.tsx` | `test-viona-mobile-sos-shell-*` (không chạy) | — | CODE-CHƯA-TEST | Shell/profile; KHÔNG RÕ “kín đáo” |

**Đếm mức (63):** KHÔNG CÓ 32 · DESIGNED 13 · CODE-CHƯA-TEST 16 · RUNTIME-PASS 2 (LO-03, TR-06 — phạm vi test hẹp như cột).

---

## 3. Nền tảng

| Mục | Có? | Đường dẫn | Test |
|---|---|---|---|
| Identity + tenant isolation | Một phần | JWT `src/middleware/authMiddleware.ts`; `User`; `VionaRequest.tenantId`; `MerchantProfile.tenantId` `@unique` (`prisma/schema.prisma` ~926–939); assert tenant trên webhook | Pack40 tenant adversarial scripts — **KHÔNG CHẠY**. Isolation không thấy trên `Booking`/`Wallet` (không có `tenantId`) |
| Authority record (một lần, chống replay) | Một phần | `VionaRequestExecutionAttempt.executionKey` `@unique`, `providerIdempotencyKey` `@unique`, `@@unique([requestId, attemptNumber])`; webhook signature replay bound (`vionaWebhookSignatureVerificationService.ts`); Stripe `ProcessedStripeEvent` | pack40d1 **47 PASS**. Đây là attempt/idempotency, **không** phải authority record đủ INDEX §041 |
| Cost ledger ≠ payment ledger | Một phần | Payment: `Wallet`/`Transaction`. AI cost: `src/core/aiCost/aiCostGuardRegistry.ts` — comment **“not live metering”**. Usage log: `LlmApiUsageLog` | `ai:cost-readiness` scripts — **KHÔNG CHẠY**. Không thấy bảng cost ledger tách |
| Budget reservation | Một phần | `Wallet.lockedBalanceVIG` + `VionaRequestEscrowHold` (Pack31). Local mặc định `REQUEST_ONLY_NO_CHARGE` | Tourism/local hold tests — một script timeout **PASS**; reservation AI/voice **không thấy** |
| Outbox/inbox + idempotency | Một phần | Inbox UI: Local/Tourism/VionaRequest. Idempotency: Stripe event, escrow `idempotencyKey`, wallet AI debit key. **Không** thấy bảng outbox/inbox event | Nhiều test inbox local — **KHÔNG CHẠY** R0 |
| Capability registry | Một phần | `src/config/vionaCapabilityReadiness.ts` (6 universe + home, không 63 ID). Matrix `docs/product/VIONA_CAPABILITY_MATRIX.md` (dirty). Registry 63 ID: zip + untracked `docs/product/bme-release-2026-10-02/VIONA_BME_MODULE_ENGINE_REGISTRY.json` | `scripts/viona-capability-readiness-check.mjs` — **KHÔNG CHẠY**. Matrix ghi “not wired into live UI” |
| State machine Request→Quote→Hold→Booking | Một phần | Local: `LocalServiceRequestStatus` DRAFT→…→EXPIRED (không có Quote). Tourism: hold/confirm/settle enums. Generic `Booking`: PENDING/CONFIRMED/COMPLETED/CANCELLED | Local create envelope **PASS**; SM đầy đủ **KHÔNG RÕ** (chưa chạy e2e) |
| DB chống double booking | Không | `Booking`: chỉ `@@index([businessId, timeSlot])`, **không** `@@unique`. `createBooking` (`src/services/api/BookingService.ts:176`) `tx.booking.create` không kiểm overlap | Không thấy test chống double-book |
| Mock/adapter provider | Có | Twilio adapters dưới `src/lib/viona/realProviderAdapter/`; OpenAI adapter **unwired**; DemoSandbox mock REST | pack30d tests — **KHÔNG CHẠY** |
| CI | Có | `release-discipline.yml` + merge-authorization workflows | Chạy trên GitHub; R0 không gọi remote |

---

## 4. Vi phạm luật bất biến (AGENTS / INDEX §1 — bằng chứng code)

| Luật | Quan sát |
|---|---|
| AI/agent ghi DB trực tiếp | **Có đường:** `AIRouterService.persistLlmUsageLog` → `prisma.llmApiUsageLog.create`; `TranslationService` persist cache. Không đi qua authority record |
| Timeout = success | **Không thấy gán success.** Gateway ghi `outcomeUncertain` (pack40d3a test tên “Timeout records outcomeUncertain”). Tourism timeout → bucket `eligible` để **release**, không confirm booking |
| Provider/payment không qua authority | **Một phần.** Booking/wallet lock không có authority record. Twilio real adapter có flag + breaker riêng, không gắn Express AI router |
| Retry cùng UUID voice | **KHÔNG RÕ** — không thấy voice UUID attempt model |
| Thiếu budget | AI cost registry `productionReady: false`, “not live metering”. Express paid AI **không** có admission gate trong HEAD (file gate chưa tồn tại) |
| Secret trong repo | Untracked: `.env`, `.env.local`, `.env.backup-before-viona-staging`, `google-services.json`, `GoogleService-Info.plist` — **có secret ở các đường dẫn này** (không chép giá trị). Tracked: `.env.example` (không đọc). CI lấy Firebase config từ GitHub secrets |
| Request gọi là booking | **Có cầu:** `LocalServiceRequest.legacyBookingId`. Generic `Booking` vẫn dùng cho đặt chỗ B2C. Local SM dùng “request” |
| Chức năng bị xóa | Capability matrix: gate/preview, không xóa. `NO_FUNCTION_REMOVAL` trong AGENTS. R0 không thấy xóa chức năng trong HEAD so với mô tả code hiện có |

---

## 5. Nợ kỹ thuật / rủi ro (tối đa 10)

1. **Không có `docs/spec/` trong repo** — 63 module chỉ ở zip ngoài + JSON BME untracked → không có SSOT trong canonical tree.
2. **`Booking` không unique slot** — `src/services/api/BookingService.ts` + `prisma/schema.prisma` model `Booking`.
3. **Paid AI Express không có admission fail-closed** — `createRoutedChatCompletion` đọc `OPENAI_API_KEY` rồi `new OpenAI` (`AIRouterService.ts:85-96`). Client dịch có fallback Firebase `getChatCompletion` (`MinhKhangService.ts:109-121`).
4. **Cost firewall chưa metering** — `aiCostGuardRegistry.ts` tự ghi planning-only.
5. **Tenant isolation không đều** — có trên `VionaRequest`/`MerchantProfile`, không trên `Wallet`/`Booking`.
6. **`.env` local bị Prisma CLI nạp** khi `prisma validate` — rủi ro test khác nạp key thật (đã có sự cố lịch sử ghi trong pack39 helper).
7. **Working tree dirty 57 path** (Academy/LO-03/cinematic/merge-gate/BME) — không phải baseline sạch.
8. **Launch manifest zip** (`manifest.md`) status `ĐỀ XUẤT - chưa có hiệu lực`, ô phê duyệt trống.
9. **BME/Toàn thư V5 untracked** — Kernel dirty ghi conflict AT-09 chưa adopted.
10. **~97 test scripts, không runner tổng** — phần lớn chưa chạy ở R0; không có bằng chứng RUNTIME cho đa số module.

---

## 6. Phân loại thành phần

`adopted` = được phép dùng làm nền — **cần Operator xác nhận**. Dưới đây là đề xuất, không tự nhận adopted.

| Thành phần | Đề xuất | Lý do |
|---|---|---|
| `AGENTS.md` + Envelope Spec (tracked, sạch) | candidate → chờ xác nhận adopted governance | Điều khiển executor; không tự cấp quyền |
| Operating Protocol / Kernel / Blueprint V2 | candidate (dirty +31/+5/+2 dòng) | Bản committed khác working tree |
| `vionaCapabilityReadiness.ts` + matrix | candidate | 6 universe; matrix dirty; chưa wire UI |
| BME zip / `bme-release-2026-10-02/` | candidate | Untracked; Kernel: không thay Blueprint V2 |
| Prisma Local request + eligibility | candidate (lát P5 Local) | Có test R0 hẹp |
| Wallet/Stripe/`Transaction` | candidate (tiền) | Có; không phải AT-05 đủ spec |
| `VionaRequest` + execution attempt | candidate (lát P2/P6) | pack40d1 PASS; authority spec chưa đủ |
| REC2 Home / cinematic untracked | candidate | Nhiều file `??` |
| `AUDIT_REPORT_VIGLOBAL.md`, `ket-noi-global` | historical | Thương hiệu/báo cáo cũ |
| Twilio OpenAI real adapter unwired | candidate / gated | Flag Pack30D; không đụng router |

---

## 7. Phase đề xuất và 3 việc tiếp

**Phase hiện tại: P0 (REC2-R0 · Canonical và governance).**

Lý do bằng chứng: bước này đúng R0 inventory; repo **không** chứa `docs/spec/INDEX.md`; registry 63 ID chưa adopted; launch manifest chưa ký. Code đã có **lát** P2 (attempt/idempotency/tenant một phần), P3 (Home/shell), P4 (Account/wallet), P5 (LO-03), P6 (voice demo + execution attempt) — nhưng INDEX gọi P0 xong khi canonical/spec/governance chốt. Không nhảy P2 khi SSOT 63 module còn ngoài repo.

**3 việc tiếp:**

1. Operator xác nhận bảng §2–§6 (đặc biệt adopted vs candidate) và quyết định có nạp `docs/spec/` từ zip vào canonical hay giữ zip ngoài.
2. Chốt P2 tối thiểu: unique chống double-book **hoặc** cấm dùng `Booking` cho slot; tách/ghi nhận cost ledger vs payment; authority single-use cho paid AI/voice — từng cái một envelope.
3. Chạy có kiểm soát (không nạp `.env` provider) các `test-local-*` còn lại + pack40 schema tests, rồi mới mở P1 hợp đồng sản phẩm theo INDEX.

---

## 8. Tóm tắt 5 dòng

1. **Có:** Expo+Express+Prisma; CI; Local request (LO-03) có test R0; tourism hold classifier; execution-attempt schema 47 PASS; wallet/Stripe/escrow; lễ tân/interpreter code demo; Kids/Adult academy UI.
2. **Thiếu:** `docs/spec/` trong repo; 32/63 module không có code; capability registry 63 ID chưa adopted; double-book unique; AI admission; cost metering sống.
3. **Rủi ro lớn nhất:** paid provider + `.env` auto-load + `Booking` không khóa slot, trong khi spec launch giả định authority/budget/fail-closed.
4. **Phase đề xuất:** P0.
5. **Việc tiếp:** Operator ký inventory → quyết định nguồn spec → envelope P2 cho 3 lỗ nền tảng trên.
