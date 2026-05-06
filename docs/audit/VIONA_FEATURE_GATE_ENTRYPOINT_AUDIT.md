# VIONA Feature Gate Entry-Point Audit

**Vai trò:** Principal Product Safety Auditor (read-only).  
**Phạm vi:** Entry point mock / high-risk chuẩn bị feature-gate khỏi MVP mini-app platform.  
**Quy tắc audit:** Không sửa code trong task này; không in secret; không chắc → ghi **Chưa xác định**.

**Tài liệu đã đọc (đại diện):** `docs/audit/VIONA_CODEBASE_AUDIT.md`, `docs/audit/VIONA_REPO_STATE_LOCK.md`, `docs/ai-context/MINI_APP_PLATFORM_ARCHITECTURE.md`, `docs/ai-context/AI_RULES.md`, `src/core/feature-flags/featureFlags.ts`, `src/core/miniapps/miniAppRegistry.ts`, `src/core/brand/brandConfig.ts`.

---

## 1. Executive Summary

- **Feature nguy hiểm nhất:** **AI Legal Scan** — phản hồi phân tích là **mock** (`mockLegalScan`) trong khi API **trừ VIG thật** trên ví (`Wallet.balanceVIG` decrement + `Transaction` `TxType.AI_LEGAL_SCAN`). Rủi ro niềm tin + tiền: user trả token cho “AI pháp lý” không tương xứng độ tin cậy production.
- **Phải tắt / đóng băng trước MVP (khuyến nghị):** Legal scan (UI + API hoặc chỉ debit), **Broker shell đầy đủ** (commission/escrow phức tạp nếu chưa harden), **Omni/Admin demo metrics** nếu build lỡ bật admin debug, **KOL dashboard số mock**, **Payroll/auto-tip UI** dựa map cứng, **Voice AI receptionist** luồng merchant (sketch + event giả lập).
- **Có thể “coming soon”:** **Travel** hub (tab B2C đang mount `TravelHubScreen` → `TravelScreen`; registry đã `coming_soon`), **Academy** (tab `LeTanScreen` — “Lễ Tân / Academy” theo nhãn tab; registry `academy` ≠ wiring tab hiện tại — **Chưa xác định** mapping 1:1 tab vs mini-app id).
- **Có thể giữ trong MVP:** **Hub**, **Local** (sau khi ẩn/gate nút Legal Scan), **Booking** lõi, **Merchant dashboard basic** — khớp `hubEnabled` / `localEnabled` / `bookingEnabled` / `merchantDashboardEnabled` (mặc định `true` trong `getFeatureFlags`).

**Ghi chú kiến trúc quan trọng:** `getFeatureFlags()` hiện **chỉ được dùng trong `miniAppRegistry.ts`**. `MainTabNavigator`, `LocalScreen`, `App.tsx`, v.v. **Chưa xác định** có import `getFeatureFlags` để ẩn tab/route — cờ đã định nghĩa nhưng **chưa wire vào navigation** (grep toàn `src` chỉ thấy registry + định nghĩa flag).

---

## 2. Feature Entry-Point Table

| Feature | Current Status | Entry Points | User Visible? | Risk | Recommended Flag | Recommended Action |
|---------|----------------|--------------|---------------|------|------------------|-------------------|
| AI Legal Scan | Mock AI + **real VIG debit** | `POST /api/ai/legal-scan` (`aiRoutes` + `AIController.postLegalScan`); `LocalScreen` button “AI Legal Scanner”; `aiService.scanLegalDocument` / `previewLegalScanCostVig` | Có (B2C Local) | **P0** | `legalScanEnabled` | **freeze** (hoặc hide UI + server 403 đến khi LLM thật + compliance) |
| AI / Voice Receptionist | Architecture **sketch** + mock transport | `VoiceReceptionistService.ts`; `SmartCalendarScreen` (subscribe events); `WalletB2BScreen` (DEV mock tier / pending commission copy); `useAIReceptionist.ts` (mock polling); `MerchantDetailScreen` import voice service | Merchant/B2B nếu vào màn | P1 | `aiReceptionistEnabled` | **freeze** / **hide** (registry đã `frozen`) |
| Payroll / Auto-tip | **Hardcoded** staff + tips | `PayrollService.calculateDailyTips`; `DashboardScreen` (commercial) `DEMO_MERCHANT_ID` + tip ledger UI | Có nếu navigate tới `Dashboard` commercial | P1 | `payrollEnabled` | **hide** hoặc **convert_to_demo_label** |
| VIG / Wallet economy | VIG hiển thị khắp app; một số luồng demo | `WalletTopUpScreen`, `GlobalWalletScreen`, `LoyaltyRewardsScreen`, `TourismHubService` pricing VIG, `AIController` legal debit, broker escrow, `LeTanScreen` + `chargeTrustedService` | Có | P0–P1 | `vigTokenEconomyEnabled` (+ `liveStripePaymentEnabled` cho top-up thật) | **needs_manual_review** từng surface; P0: đồng bộ messaging “không phải tiền pháp định” |
| Broker QR / commission | API + escrow + UI role | `app.ts` `/api/broker`; `brokerRoutes`; `BookingService` → `finalizeBrokerQrProgramAfterBookingCommit`; `MainTabNavigator` BROKER tabs; `BrokerDashboardScreen`, `BrokerQrTabScreen`; `BrokerService` | User role BROKER | P1 | `brokerQrEnabled` | Registry **frozen** — **hide** tabs MVP; giữ attribution backend **Chưa xác định** nếu product yêu cầu im lặng |
| Admin / Omni demo | **Synthetic** dataset + mock omni | `AdminDashboardScreen`; `AdminFinanceService.getAdminDashboardDataset`; `runOmniBrainDemoScenarios`; `OmniChannelService` seed/log; `App.tsx` chỉ mount Admin stack khi `isAdminDebugSurfaceEnabled()` | Không (mặc định); Có nếu env debug | P0 nếu lộ | `adminDemoMetricsEnabled`, `omniDemoEnabled` | **hide** + rely on `adminDebugGate`; flag wire thêm |
| KOL dashboard | **MOCK_** constants doanh thu | `KOLPartnerDashboard.tsx`; `DashboardScreen` → navigate; `App.tsx` `GatedKOLPartnerDashboardScreen` | B2B nếu mở | P1 | `kolDemoEnabled` | **hide** hoặc **convert_to_demo_label** |
| Travel | Tab B2C luôn có component | `MainTabNavigator` `MAIN_TAB.B2C.travel` → `TravelHubScreen` → `TravelScreen`; `/api/tourism/*` | Có | P2 compliance/trust | `travelEnabled` | **coming_soon** (khớp registry) hoặc **hide** tab |
| Academy / Le Tan | Tab `MAIN_TAB.B2C.ai` → `LeTanScreen` | `LeTanScreen.tsx` (AI reception + booking + wallet hooks) | Có (B2C, paywall một phần) | P1 | `academyEnabled` | **coming_soon** / **hide** nếu MVP chỉ Hub+Local+Booking |

---

## 3. Legal Scan Audit

**Files / routes / services**

- API: `src/routes/aiRoutes.ts` — `POST /legal-scan` sau `authMiddleware`.
- Controller: `src/controllers/AIController.ts` — `postLegalScan`, `mockLegalScan`, `LegalScanPaymentError`.
- Pricing: `src/domain/legalScanPricing.ts` (ước tính trang / giá VIG).
- Client: `src/services/aiService.ts` — `scanLegalDocument`, `previewLegalScanCostVig`.
- UI: `src/screens/b2c/LocalScreen.tsx` — state `legalScanBusy`, `onLegalScannerPress`, `runLegalScanAfterPriceConfirm`, nút “AI Legal Scanner”.

**Có trừ VIG / balance thật không?**

- **Có.** Trong transaction Serializable: `wallet.updateMany` decrement `balanceVIG`, `transaction.create` với `TxType.AI_LEGAL_SCAN`, `TxStatus.SUCCESS`.

**Có mock không?**

- **Có.** Kết quả scan từ `mockLegalScan(documentText)` (keyword heuristic), comment thay thế OpenAI sau.

**P0 risk**

- User thanh toán bằng VIG cho đầu ra không phải legal advice đã kiểm chứng → sai kỳ vọng + tranh chấp.

**Cách gate đề xuất**

- Bắt buộc `legalScanEnabled === true` ở **client** (ẩn nút + không gọi API) và **server** (trả 403/404 khi tắt — file server liên quan cùng controller; task sau).
- Hoặc freeze hoàn toàn: không debit cho đến khi pipeline LLM + disclaimer + QA xong.

---

## 4. AI Receptionist Audit

**Files / screens / services**

- `src/services/ai/VoiceReceptionistService.ts` — header: “architecture sketch”, mock layer, tool stubs, `queueMockWholesalePrintSlip`.
- `src/screens/b2b/SmartCalendarScreen.tsx` — `subscribeVoiceReceptionistAiEvents`.
- `src/hooks/useAIReceptionist.ts` — comment “Mock receptionist transport (polling)”.
- `src/screens/b2c/MerchantDetailScreen.tsx` — import `voiceReceptionistService`.
- `src/screens/b2b/WalletB2BScreen.tsx` — toggle DEV mock tier, “Sổ chờ quyết toán (mock)”.
- Entitlement: `src/services/billing/V7EntitlementService.ts` — feature ids `ai_receptionist_*`.
- Registry: `miniAppRegistry` — `ai_receptionist` **status: `frozen`**.

**Real / mock**

- **Chủ yếu mock / sketch** — không có Twilio/OpenAI Realtime wiring đầy đủ trong file đã đọc; media bridge ghi là intended.

**Có lộ ra user/merchant không?**

- **Có** nếu merchant mở Smart Calendar / Wallet B2B / chi tiết merchant — trải nghiệm có thể hiểu như production.

**Cách gate đề xuất**

- Giữ `frozen` trong registry; thêm gate UI theo `aiReceptionistEnabled` + ẩn DEV toggle trên build production; `WalletB2B` mock copy → **convert_to_demo_label**.

---

## 5. Payroll Audit

**Files**

- `src/services/b2b/PayrollService.ts` — `STAFF_BY_MERCHANT`, `TIPS_BY_MERCHANT` map cứng; `calculateDailyTips`.
- `src/screens/commercial/DashboardScreen.tsx` — import `calculateDailyTips`, `DEMO_MERCHANT_ID = 'merchant-lotus'`, UI tip ledger.

**Hardcoded / mock**

- **Rõ ràng mock/dataset cố định** cho demo merchant ids.

**Cách gate đề xuất**

- `payrollEnabled`: ẩn section payroll trên `DashboardScreen` hoặc thay toàn bộ bằng nhãn “Demo — không ảnh hưởng sổ thật”.

---

## 6. Wallet / VIG Token / Payment Audit

**Nơi token / balance xuất hiện (không đầy đủ — grep mở rộng khi implement)**

- B2C: `DashboardB2CScreen` (VIG token / rewards), `LoyaltyRewardsScreen` (đổi quà, chuỗi **mock** trong alert), `GlobalWalletScreen`, `WalletTopUpScreen` (Stripe/platform pay — **Chưa xác định** mọi nhánh có live hay sandbox).
- Tourism: `TourismHubService.ts`, `routes.ts` comments VIG checkout travel.
- Legal scan: debit VIG (mục 3).
- Broker: `BrokerService`, `brokerEmpireEscrow` — escrow / commission VIG.

**Nơi trừ / cộng balance thật (đại diện đã xác minh)**

- Legal scan: decrement wallet + transaction (mục 3).
- `LeTanScreen` import `chargeTrustedService`, `syncWalletFromServer` — **Chưa xác định** từng nhánh booking có luôn hit server hay có đường demo.

**Payment fake / manual / real**

- `DashboardScreen` Flash Sale: alert “Đang hoàn thiện” / không charge — **manual / placeholder**.
- `WalletTopUpScreen`: `createPlatformPayIntent`, `pollTopupCreditEntitlement` — hướng **real integration** khi cấu hình; cờ `liveStripePaymentEnabled` tồn tại nhưng **Chưa xác định** chỗ consume trong màn này (grep nhanh không thấy trong phạm vi đọc file đầu).

**MVP: giữ / ẩn**

- **Giữ:** hiển thị ví tối thiểu phục vụ booking/local nếu product chốt ví trong MVP — **needs_manual_review**.
- **Ẩn:** legal scan debit, loyalty mock copy kiểu “18,5 EUR chi tiêu mock”, broker commission UI, B2B wallet DEV toggles trên production build.

---

## 7. Broker QR Audit

**Phần basic có thể giữ (theo kiến trúc doc)**

- Gán `brokerId` cho merchant, QR discovery cơ bản — **Chưa xác định** file UI tách biệt “chỉ attribution” vs “full wallet”; cần product spec.

**Phần nên frozen**

- Escrow 7 ngày, leadership %, activation bounty, finalize sau booking (`brokerEmpireEscrow`, `BookingService`) — logic tài chính nặng; registry đã **frozen** cho mini-app `broker`.

**Flag đề xuất**

- `brokerQrEnabled` + không render BROKER tabs trong `MainTabNavigator` khi false; server có thể thêm guard route broker (task sau).

---

## 8. Admin / KOL / Omni Demo Audit

**Files**

- `src/screens/admin/AdminDashboardScreen.tsx` — Omni switches (FCM/Zalo/Twilio **mock** copy), `runOmniBrainDemoScenarios`, “Live Activity Log (mock)”, AI Fintech Scanner “(mock)”.
- `src/services/admin/AdminFinanceService.ts` — `getAdminDashboardDataset` với số **cứng** (revenue, DAU, v.v.).
- `src/services/marketing/AutoPilotBrain.ts` (import) — demo scenarios.
- `src/services/marketing/OmniChannelService.ts` — demo log / switches.
- `App.tsx` — Admin stack conditional `isAdminDebugSurfaceEnabled()`.
- `src/config/adminDebugGate.ts` — env `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG`, PIN chỉ dev.
- KOL: `src/screens/commercial/KOLPartnerDashboard.tsx` — `MOCK_B2C_USERS_INVITED`, `MOCK_TOTAL_REVENUE_*`.

**Demo / fake metrics**

- Admin dataset + KOL constants + Omni log — **fake / demo**.

**Risk nếu lộ production**

- Niềm tin vào “số liệu điều hành” và cảm giác backdoor (secret tap trên `HomeScreen` khi debug bật).

**Gate đề xuất**

- Không bật `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG` trên pilot ngoài; wire `adminDemoMetricsEnabled` / `omniDemoEnabled` / `kolDemoEnabled` vào UI + stack registration (hiện **chưa wire**).

---

## 9. Travel / Academy Audit

**Màn đang hiện (B2C tabs)**

- **Travel:** `MainTabNavigator` — `MAIN_TAB.B2C.travel` → `TravelHubScreen` → `TravelScreen` (**active** theo default tab set).
- **Academy / AI tab:** cùng navigator — `MAIN_TAB.B2C.ai` → `LeTanScreen`; paywall khi không user (`listeners.tabPress`).

**Coming soon vs hidden**

- **Travel:** **coming_soon** khớp `miniAppRegistry` + ẩn tab hoặc màn placeholder khi `!travelEnabled` — hiện tab vẫn render full `TravelScreen` (flag **chưa** áp dụng tại navigator).
- **Academy:** nếu MVP không gồm Le Tan đầy đủ — **hidden** hoặc **coming_soon**; **Chưa xác định** product có coi `LeTanScreen` là “Booking assistant” thuộc MVP hay không.

**Stack khác (học tập)**

- `App.tsx` nhóm: `AdultLearningHome`, `KidsLearningHome`, `VietKids`, v.v. — entry từ Hub/deep link; **Chưa xác định** tần suất user thấy trong MVP.

**Flag đề xuất**

- `travelEnabled`, `academyEnabled` — đồng bộ với tab visibility + deep links.

---

## 10. Proposed Code Change Plan

*Không thực hiện trong task audit; chỉ đề xuất.*

| Priority | Change | Files likely involved | Flag to use | Acceptance Criteria |
|----------|--------|----------------------|-------------|---------------------|
| P0 | Ngăn debit VIG khi legal scan tắt; ẩn nút Local | `AIController.ts`, `aiRoutes.ts`, `LocalScreen.tsx`, (optional) middleware | `legalScanEnabled` | Không gọi API / không debit khi flag off; copy rõ “tính năng tắt” |
| P0 | Wire `getFeatureFlags()` vào `MainTabNavigator` (và stack) cho travel/academy/broker | `MainTabNavigator.tsx`, `App.tsx`, có thể helper `navigation/featureGate.ts` | `travelEnabled`, `academyEnabled`, `brokerQrEnabled` | Tab ẩn hoặc “Sắp ra mắt” đúng env MVP |
| P0 | Rà soát copy “mock” trên màn ví/loyalty | `LoyaltyRewardsScreen.tsx`, `WalletB2BScreen.tsx` | `vigTokenEconomyEnabled` / demo labels | User không thấy số liệu giả dưới dạng tiền thật |
| P1 | Gate KOL dashboard + commercial dashboard payroll block | `DashboardScreen.tsx`, `App.tsx` (stack), `KOLPartnerDashboard.tsx` | `kolDemoEnabled`, `payrollEnabled` | Không vào được hoặc chỉ chế độ demo có nhãn |
| P1 | Gate Smart Calendar / voice events theo flag | `SmartCalendarScreen.tsx`, điều hướng B2B | `aiReceptionistEnabled` | Không toast/booking giả lập khi tắt |
| P2 | Đồng bộ `miniAppRegistry.getVisibleMiniApps` với shell (Hub picker / deeplink) | Shell screens, docs | registry + flags | Một nguồn sự thật cho marketing “mini-app” |

---

## 11. Do Not Touch List (feature-gating pass đầu)

- `prisma/schema.prisma`, `prisma/migrations/**`
- Auth flow: `AuthController`, `authRoutes`, `EmailOtpService`, `validateBody` auth-only, refresh session (theo `VIONA_REPO_STATE_LOCK`)
- Stripe webhook path / raw body ordering trong `app.ts`
- `package.json` / `package-lock.json` (trừ khi task riêng deps)
- OTP / rate limit đang ổn định (`RateLimitMiddleware` — chỉ đụng khi task bảo mật)
- Thay đổi contract API (`jsonOk`/`jsonFail` shape) không được phép trong pass “chỉ gate UI”

---

## 12. Final Recommendation

**Task code tiếp theo nên là gì?**

- **Wire flags vào navigation + critical API guards** — ưu tiên **legal scan** (mock + tiền thật) và **tab Travel/Broker/Academy** để khớp MVP Hub+Local+Booking+Merchant basic.

**Nên gate feature nào trước?**

1. AI Legal Scan (P0).  
2. Tab/route không thuộc MVP (Travel, Broker, Academy tùy spec).  
3. KOL + payroll demo trên commercial dashboard.

**Có nên wire `miniAppRegistry` vào navigation ngay không?**

- **Nên, theo phase:** registry đã là catalog + policy (`frozen` / `coming_soon`); navigator hiện **không đọc** registry — nên **import helper** từ registry hoặc mirror cùng `getFeatureFlags()` để tránh drift. Không nhất thiết thay toàn bộ navigator một lần: có thể bắt đầu từ **điều kiện render Tab.Screen** + **stack Screen** trùng keys với `FeatureFlags`.

---

## Phụ lục — Top 10 entry point rủi ro (tóm tắt)

1. `POST /api/ai/legal-scan` — debit VIG + mock scan.  
2. `LocalScreen` — nút AI Legal Scanner.  
3. `AIController.postLegalScan` — transaction wallet.  
4. `BookingService` → `finalizeBrokerQrProgramAfterBookingCommit` — broker economy side-effect.  
5. `MainTabNavigator` — role `BROKER` full tabs.  
6. `LoyaltyRewardsScreen` — mock chi tiêu / demo redeem.  
7. `KOLPartnerDashboard` — mock revenue cohort.  
8. `AdminDashboardScreen` + `getAdminDashboardDataset` — synthetic KPI (nguy hiểm nếu admin debug bật).  
9. `VoiceReceptionistService` + `SmartCalendarScreen` — sự kiện booking/wholesale giả lập.  
10. `WalletB2BScreen` — DEV mock tier + commission “mock” copy.

## Phụ lục — P0 changes đề xuất

- Gate + tắt debit **Legal Scan** khi `!legalScanEnabled`.  
- Ẩn nút Legal Scan trên `LocalScreen` khi `!legalScanEnabled`.  
- Wire `travelEnabled` / `brokerQrEnabled` / `academyEnabled` vào tab navigator MVP.

## Phụ lục — Task code tiếp theo (một dòng)

Implement **navigation + server guard** theo `getFeatureFlags()`, bắt đầu từ **legal scan** và **B2C/BROKER tabs**.

---

*Kết thúc audit read-only: không chỉnh sửa mã nguồn ứng dụng trong task này.*
