# VIONA Cursor State Recovery Audit

**Vai trò:** Release Recovery Auditor (read-only + lệnh kiểm tra an toàn).  
**Thời điểm:** snapshot từ phiên audit Cursor (cùng session tạo file này).  
**Lưu ý:** Một số mục ghi **Chưa xác định** khi không đọc hết diff từng file hoặc không chạy runtime.

---

## 1. Executive Summary

- **Repo hiện đang ở trạng thái nào?** Working tree **bẩn, lớn**: nhiều file tracked **đã sửa** (app, API, Prisma, package, màn hình, dịch vụ) và **nhiều path untracked** (`docs/ai-context/`, `docs/audit/`, `src/core/**`, migration auth, middleware validation). **Typecheck và lint (0 errors) pass** tại thời điểm chạy.
- **Có an toàn để tiếp tục code không?** **Tiếp tục code cục bộ** được nếu giữ scope rõ; **không an toàn** để coi đây là “main sạch” hoặc merge/release mà **chưa** review nhóm thay đổi (đặc biệt `prisma/schema.prisma`, auth, broker, wallet-related services). Nên **phân tách commit / review** trước.
- **Task gần nhất đã hoàn thành là gì?** Trên tree hiện tại: **Blueprint** (`VIONA_FINAL_MASTER_BLUEPRINT.md`) **có mặt** trong `docs/ai-context/` (untracked); **feature flags + mini-app registry** đã được **cài trong source** (`src/core/feature-flags/`, `src/core/miniapps/`) — **Chưa xác định** đã commit hay chưa vì cả thư mục đang **untracked**. **VIO Display** đã **áp dụng một phần** (ví dụ `WalletTopUpScreen` disclaimer, `HomeScreen` format VIO, i18n disclaimer) nhưng **còn sót public “VIG Token”** ở ít nhất `LoyaltyRewardsScreen`, `LocalScreen`.
- **Task nào có vẻ đang làm dở?** **Git hygiene** (add/commit theo feature); **VIO display cleanup** (loyalty/local copy); **gắn navigation/shell với `miniAppRegistry`** (registry **chưa** được import trong `MainTabNavigator` — **Chưa xác định** chỗ khác); có thể **auth refresh session** (migration + controller) đang mở song song.
- **Rủi ro lớn nhất hiện tại là gì?** **P0:** Trộn thay đổi **DB schema / auth / rate limit / broker / booking / monetization** trong một working tree chưa đóng gói; **foundation `src/core/` chưa tracked** → dễ mất hoặc khó review PR. **P1:** Copy **VIG** còn lộ trên UI dù policy VIO.

---

## 2. Git Status Snapshot

### `git status --short`

```
 M App.tsx
 M package-lock.json
 M package.json
 M prisma/schema.prisma
 M src/app.ts
 M src/components/academy/KidsInteractiveMode.tsx
 M src/controllers/AIController.ts
 M src/controllers/AuthController.ts
 M src/i18n/strings.ts
 M src/middleware/RateLimitMiddleware.ts
 M src/navigation/MainTabNavigator.tsx
 M src/routes/authRoutes.ts
 M src/routes/brokerRoutes.ts
 M src/screens/HocTapScreen.tsx
 M src/screens/HomeScreen.tsx
 M src/screens/WalletTopUpScreen.tsx
 M src/screens/academy/LiveAiTeacherScreen.tsx
 M src/screens/admin/AdminDashboardScreen.tsx
 M src/screens/b2c/DashboardB2CScreen.tsx
 M src/screens/b2c/LocalScreen.tsx
 M src/screens/b2c/LoyaltyRewardsScreen.tsx
 M src/screens/b2c/academy/VietKidsScreen.tsx
 M src/screens/broker/BrokerCommissionsTabScreen.tsx
 M src/screens/broker/BrokerDashboardScreen.tsx
 M src/screens/commercial/AngelInvestmentHub.tsx
 M src/services/WalletService.ts
 M src/services/api/BookingService.ts
 M src/services/api/BrokerService.ts
 M src/services/auth/EmailOtpService.ts
 M src/types/express-augment.d.ts
 M testOtpRateLimit.js
?? docs/ai-context/
?? docs/audit/
?? prisma/migrations/20260503120000_auth_refresh_session/
?? src/core/
?? src/middleware/validateBody.ts
?? src/navigation/mvpSurfaceGate.tsx
?? src/validation/
```

### `git diff --name-only`

```
App.tsx
package-lock.json
package.json
prisma/schema.prisma
src/app.ts
src/components/academy/KidsInteractiveMode.tsx
src/controllers/AIController.ts
src/controllers/AuthController.ts
src/i18n/strings.ts
src/middleware/RateLimitMiddleware.ts
src/navigation/MainTabNavigator.tsx
src/routes/authRoutes.ts
src/routes/brokerRoutes.ts
src/screens/HocTapScreen.tsx
src/screens/HomeScreen.tsx
src/screens/WalletTopUpScreen.tsx
src/screens/academy/LiveAiTeacherScreen.tsx
src/screens/admin/AdminDashboardScreen.tsx
src/screens/b2c/DashboardB2CScreen.tsx
src/screens/b2c/LocalScreen.tsx
src/screens/b2c/LoyaltyRewardsScreen.tsx
src/screens/b2c/academy/VietKidsScreen.tsx
src/screens/broker/BrokerCommissionsTabScreen.tsx
src/screens/broker/BrokerDashboardScreen.tsx
src/screens/commercial/AngelInvestmentHub.tsx
src/services/api/BookingService.ts
src/services/api/BrokerService.ts
src/services/auth/EmailOtpService.ts
src/types/express-augment.d.ts
testOtpRateLimit.js
```

*Ghi chú:* `git diff --name-only` **không** liệt kê `src/services/WalletService.ts` trong output thu được dù `git status` báo `M` — **Chưa xác định** (có thể khác index/stage hoặc chỉ thay đổi line ending). Ưu tiên coi **`git status --short` là nguồn truth** cho “đã đụng file”.

### `git ls-files --others --exclude-standard`

```
docs/ai-context/AI_RULES.md
docs/ai-context/API_REFERENCE.md
docs/ai-context/ARCHITECTURE.md
docs/ai-context/B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE.md
docs/ai-context/CURRENT_STATE.md
docs/ai-context/DATA_MODEL.md
docs/ai-context/MINI_APP_PLATFORM_ARCHITECTURE.md
docs/ai-context/PROJECT_CONTEXT.md
docs/ai-context/ROADMAP.md
docs/ai-context/SESSION_LOG.md
docs/ai-context/SETUP.md
docs/ai-context/TASK_HANDOFF_TEMPLATE.md
docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md
docs/ai-context/VIONA_MONETIZATION_ZERO_LOSS_ENGINE.md
docs/audit/VIONA_CODEBASE_AUDIT.md
docs/audit/VIONA_CURSOR_STATE_RECOVERY_AUDIT.md
docs/audit/VIONA_FEATURE_GATE_ENTRYPOINT_AUDIT.md
docs/audit/VIONA_REPO_STATE_LOCK.md
docs/audit/VIONA_RESIDUAL_SURFACE_AUDIT.md
docs/audit/VIONA_VIO_DISPLAY_SURFACE_AUDIT.md
prisma/migrations/20260503120000_auth_refresh_session/migration.sql
src/core/brand/brandConfig.ts
src/core/feature-flags/featureFlags.ts
src/core/miniapps/miniAppRegistry.ts
src/core/miniapps/miniAppTypes.ts
src/core/monetization/consumerPlans.ts
src/core/monetization/costFirewallConfig.ts
src/core/monetization/index.ts
src/core/monetization/merchantPlans.ts
src/core/monetization/monetizationTypes.ts
src/core/monetization/vioDisplayConfig.ts
src/core/monetization/vioDisplayLabels.ts
src/core/monetization/zeroLossPolicy.ts
src/middleware/validateBody.ts
src/navigation/mvpSurfaceGate.tsx
src/validation/authSchema.ts
```

---

## 3. Recently Changed Files

| File | Status | Area | Likely Task | Risk | Should Touch Next? |
|------|--------|------|-------------|------|--------------------|
| `prisma/schema.prisma` | M | DB | Auth / session / schema drift | P0 | Không — đến khi review migration |
| `prisma/migrations/20260503120000_auth_refresh_session/migration.sql` | ?? | DB | Auth refresh session | P0 | Chỉ sau review + kế hoạch migrate |
| `src/app.ts` | M | API Server | Express mount / middleware order | P1 | Review cùng auth / routes |
| `src/components/academy/KidsInteractiveMode.tsx` | M | UI Academy | Kids interactive flow | P2 | **Chưa xác định** diff — tránh chồng academy task |
| `src/controllers/AuthController.ts` | M | API Auth | OTP / session / validation | P0 | Không lặp task khác trên cùng nhánh |
| `src/services/auth/EmailOtpService.ts` | M | API Auth | OTP / rate limit | P0 | Giữ scope hẹp |
| `src/routes/authRoutes.ts` | M | API Routes | Auth wiring | P0 | Cùng nhóm auth |
| `src/middleware/RateLimitMiddleware.ts` | M | API | Rate limit | P1 | Review cùng auth |
| `src/middleware/validateBody.ts` | ?? | API | Zod body | P1 | Add khi commit auth |
| `src/validation/authSchema.ts` | ?? | API | Zod schema | P1 | Add khi commit auth |
| `src/controllers/AIController.ts` | M | API AI | Legal scan gate | P1 | Đồng bộ với `legalScanEnabled` |
| `src/i18n/strings.ts` | M | i18n | VIO disclaimer / wallet copy | P1 | VIO cleanup tiếp nếu cần |
| `src/screens/WalletTopUpScreen.tsx` | M | UI | VIO display + disclaimer | P1 | Ổn để giữ; tránh đụng payment logic |
| `src/screens/HomeScreen.tsx` | M | UI | VIO + flags travel/academy | P1 | Navigation alignment sau |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | M | UI | VIO **partial** — còn “VIG Token” | P1 | **Nên** sửa copy (task VIO) |
| `src/screens/b2c/LocalScreen.tsx` | M | UI | Legal scan + classified **còn “VIG Token”** | P1 | **Nên** sửa copy |
| `src/screens/broker/*.tsx` | M | UI | Broker demo / VIO labels | P2 | Chỉ copy; không backend |
| `src/services/api/BrokerService.ts` | M | Client API | `brokerQrEnabled` guard | P1 | Giữ kill-switch |
| `src/services/api/BookingService.ts` | M | Client API | Broker / booking | P1 | Review diff trước khi sửa tiếp |
| `src/services/WalletService.ts` | M (status) | Service | Wallet / settlement | P0 | **Chưa xác định** diff — review bắt buộc |
| `src/navigation/MainTabNavigator.tsx` | M | Navigation | Tabs + feature flags | P1 | Super App Lite alignment sau |
| `src/navigation/mvpSurfaceGate.tsx` | ?? | Navigation | MVP gate helper | P2 | Commit cùng nav nếu dùng |
| `App.tsx` | M | Shell | Entry / wiring | P2 | Tránh đụng nếu không cần |
| `package.json` / `package-lock.json` | M | Tooling | Deps / scripts | P2 | Không tự ý nâng deps |
| `docs/ai-context/*`, `docs/audit/*` | ?? | Docs | Blueprint / audits | Thấp | **Nên** `git add` sau review |
| `src/core/**` | ?? | Core | Flags / registry / monetization / brand | P1 | **Nên** track sớm — foundation |

---

## 4. Untracked Core Foundation Files

| File | Purpose | Present? | Tracked? | Notes |
|------|---------|----------|----------|-------|
| `src/core/brand/brandConfig.ts` | Brand display config | Có | **Không** (??) | Dùng cho UI “VIONA” / tên hiển thị — **Chưa xác định** consumer coverage |
| `src/core/feature-flags/featureFlags.ts` | Feature flags | Có | **Không** (??) | `MainTabNavigator` import path này — file **tồn tại** trên disk |
| `src/core/miniapps/miniAppRegistry.ts` | Mini-app catalog | Có | **Không** (??) | **Chưa** thấy import từ `MainTabNavigator` |
| `src/core/miniapps/miniAppTypes.ts` | Mini-app types | Có | **Không** (??) | Có `lite` / `pilot` status |
| `src/core/monetization/vioDisplayConfig.ts` | VIO public naming | Có | **Không** (??) | Display-only |
| `src/core/monetization/vioDisplayLabels.ts` | Format / labels | Có | **Không** (??) | Dùng bởi nhiều screen |
| `src/core/monetization/index.ts` | Re-exports | Có | **Không** (??) | — |
| `src/core/monetization/*.ts` (còn lại) | Plans / policy / firewall types | Có | **Không** (??) | Foundation zero-loss / monetization |

---

## 5. Completed Task Detection

| Task | Status | Ghi chú |
|------|--------|---------|
| `VIONA_FINAL_MASTER_BLUEPRINT.md` | **Done** (file tồn tại, untracked) | Nội dung **Chưa xác định** so khớp từng đoạn trong phiên này |
| Core Config Foundation (`src/core/**`) | **Partial** | File đủ bộ; **chưa tracked**; consumer **Chưa xác định** đầy đủ |
| Monetization Config Foundation | **Partial** | `monetization/*` untracked; **Chưa xác định** đã nối hết services |
| VIO Display Safety Layer | **Partial** | Disclaimer + nhiều màn đã VIO; **Loyalty + Local** còn “VIG Token” public |
| Legal Scan Kill Switch | **Partial** | `legalScanEnabled` default false; `AIController` + `LocalScreen` gate — **Chưa xác định** hết entrypoints |
| Broker Side-Effect Guard | **Partial** | `BrokerService` check `brokerQrEnabled` — **Chưa xác định** mọi path |
| Broker API Kill Switch | **Partial** | `brokerRoutes` trong danh sách M — **Chưa xác định** chi tiết |
| Navigation MVP Gate | **Partial** | `mvpSurfaceGate.tsx` untracked; `MainTabNavigator` import — cần xác nhận khi commit |
| Feature Flags + Mini-App Registry Alignment | **Partial** | Logic trong `featureFlags.ts` + `miniAppRegistry.ts` khớp blueprint **tại chỗ đọc**; **registry chưa** drive navigation |

---

## 6. Feature Flags Current State

Nguồn: `src/core/feature-flags/featureFlags.ts` (đọc tại audit).

| Flag | Default | Env-controlled? | Expected by Blueprint | Match? |
|------|---------|-----------------|------------------------|--------|
| `hubEnabled` | `true` | Không | Core ON | Có |
| `localEnabled` | `true` | Không | Core ON | Có |
| `bookingEnabled` | `true` | Không | Core ON | Có |
| `merchantDashboardEnabled` | `true` | Không | Merchant basic ON | Có |
| `academyLiteEnabled` | `true` | Không | Academy Lite ON | Có |
| `leonaAssistantEnabled` | `true` | Không | Leona Lite ON | Có |
| `travelLiteEnabled` | `true` | Không | Travel Lite ON | Có |
| `vioPointsDisplayEnabled` | `true` | Không | VIO display ON | Có |
| `b2bAiReceptionistDemoEnabled` | `true` | Không | B2B demo ON | Có |
| `b2bAiReceptionistPilotEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_B2B_AI_RECEPTIONIST_PILOT`) | Pilot gated | Có |
| `b2bAiReceptionistProductionEnabled` | `false` | Có (`…_PRODUCTION`) | Prod gated | Có |
| `b2bAutoBookingEnabled` | `false` | Có (`…_AUTO_BOOKING`) | Frozen / env | Có |
| `b2bAutoInventoryEnabled` | `false` | Có (`…_AUTO_INVENTORY`) | Frozen / env | Có |
| `b2bAutoBillPrintEnabled` | `false` | Có (`…_AUTO_BILL_PRINT`) | Frozen / env | Có |
| `b2bAutoPaymentEnabled` | `false` | Có (`…_AUTO_PAYMENT`) | Frozen / env | Có |
| `travelEnabled` | `= travelLiteEnabled` | Gián tiếp | Legacy mirror | Có |
| `academyEnabled` | `= academyLiteEnabled` | Gián tiếp | Legacy mirror | Có |
| `aiReceptionistEnabled` | `leona \|\| b2b demo` | Gián tiếp | Lite assistants | Có |
| `legalScanEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_LEGAL_SCAN`) | Frozen default | Có |
| `payrollEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_PAYROLL`) | Frozen default | Có |
| `brokerQrEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_BROKER_QR`) | Frozen default | Có |
| `vigTokenEconomyEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_VIG_TOKEN_ECONOMY`) | Frozen default | Có |
| `liveStripePaymentEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_LIVE_STRIPE_PAYMENT`) | Gated | Có |
| `adminDemoMetricsEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS`) | Gated | Có |
| `kolDemoEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_KOL_DEMO`) | Gated | Có |
| `omniDemoEnabled` | `false` | Có (`EXPO_PUBLIC_FEATURE_OMNI_DEMO`) | Gated | Có |

**Blueprint note:** Các flag “Super App Lite” default **ON** khớp mục 18 blueprint; env cũ `EXPO_PUBLIC_FEATURE_TRAVEL` / `ACADEMY` / `AI_RECEPTIONIST` **không còn** trong `getFeatureFlags` — hành vi runtime **đã đổi** so với kiểu opt-in cũ (**Chưa xác định** có doc `.env.example` cập nhật).

---

## 7. Mini-App Registry Current State

Nguồn: `src/core/miniapps/miniAppRegistry.ts`.

| Mini-App | Status | Feature Flag | Expected Status (Blueprint §14 / task) | Match? |
|----------|--------|--------------|------------------------------------------|--------|
| Hub | `active` | `hubEnabled` | Active | Có |
| Local | `active` | `localEnabled` | Active | Có |
| Booking | `active` | `bookingEnabled` | Active | Có |
| Merchant | `beta` | `merchantDashboardEnabled` | Merchant basic / beta | Có |
| VIO Points (display) | `lite` | `vioPointsDisplayEnabled` | VIO display ON, economy frozen | Có |
| Academy Lite | `beta` | `academyLiteEnabled` | Academy Lite | Có |
| Leona Assistant | `beta` | `leonaAssistantEnabled` | Leona Lite | Có |
| Travel Lite | `beta` | `travelLiteEnabled` | Travel Lite | Có |
| B2B AI Receptionist | `pilot` | `b2bAiReceptionistDemoEnabled` | Demo/Pilot | Có |
| Broker | `frozen` | `brokerQrEnabled` | Frozen until thaw | Có |
| Legal Scan | `frozen` | `legalScanEnabled` | Frozen / kill switch | Có |
| Payroll | `frozen` | `payrollEnabled` | Frozen | Có |
| VIO Token Economy | `frozen` | `vigTokenEconomyEnabled` | Frozen vs display | Có |

**Integration:** `getVisibleMiniApps()` **Chưa xác định** được dùng bởi navigation/shell tại thời điểm grep — **khoảng trống** so với “single source of truth” trong audit mini-app.

---

## 8. VIO Display Current State

| File | Public “VIG” còn? | Internal legacy | Disclaimer VIO |
|------|-------------------|-----------------|----------------|
| `src/i18n/strings.ts` | **Chưa xác định** toàn file (đã có `vioDisclaimer*` VIO) | N/A | **Có** (walletTopUp) |
| `src/screens/HomeScreen.tsx` | **Không** trong grep ngắn (`formatVioCredits` / `getVioPointsLabel`) | **Chưa xác định** | **Chưa xác định** trên Home |
| `src/screens/WalletTopUpScreen.tsx` | Copy chủ yếu VIO Credits | `amountVig` trong alert — **internal field name** | **Có** (`vioDisclaimerBox`) |
| `src/screens/b2c/DashboardB2CScreen.tsx` | **Không** (format VIO Points) | `loyaltyPoints` — OK | **Chưa xác định** |
| `src/screens/b2c/LocalScreen.tsx` | **Có** — ví dụ “VIG Token” classified | `VIP_POSTING_COST_VIG`, `reserveAndCommitCredits` | Legal scan gated; **Chưa xác định** disclaimer toàn màn |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | **Có** — title/sub “VIG Token” | `vigTokenCost`, `remainingVigTokens` trong alert | Demo EUR còn — **Chưa xác định** compliance |
| `src/screens/HocTapScreen.tsx` | **Không** (“VIO Credits” trong alert) | **Chưa xác định** | **Chưa xác định** |
| `src/screens/academy/LiveAiTeacherScreen.tsx` | **Không** (`getVioCreditsLabel`) | — | **Chưa xác định** |
| `src/screens/b2c/academy/VietKidsScreen.tsx` | **Không** (`formatVioPoints`; `award.vigTokensAdded` internal) | `vigTokensAdded` | **Chưa xác định** |
| `src/screens/broker/BrokerDashboardScreen.tsx` | **Chưa xác định** full hero | `MOCK_LIVE_COMMISSION_VIG` — tên biến legacy | **Chưa xác định** |
| `src/screens/broker/BrokerCommissionsTabScreen.tsx` | **Chưa xác định** (đã từng đổi sang VIO Points demo) | MOCK totals | **Chưa xác định** |

**Tổng quan:** **Public display vẫn có VIG** ở **Loyalty** và **Local** (ít nhất các dòng đã grep). **Internal** `vig*` / `VIG` trong field name **chưa** đánh giá là “sửa nhầm schema” trong audit này — **không đọc** Prisma/API.

---

## 9. Typecheck / Lint Result

- **`npm run typecheck`:** **pass** (`tsc --noEmit`, exit 0).
- **`npm run lint`:** **pass** với **0 errors**, **51 warnings** (unused imports, hooks deps, array-type style, v.v. — chủ yếu codebase rộng, không liệt kê từng file tại đây).
- **Không sửa lỗi** trong task audit.

---

## 10. Risk Assessment

| Risk | Severity | Evidence | Recommendation |
|------|----------|----------|----------------|
| Working tree trộn auth + prisma + UI + broker + wallet | **P0** | `git status` nhiều `M` + migration ?? | Dừng thêm feature; **chia commit / PR** theo domain |
| `src/core/**` untracked nhưng đã import từ app | **P0** | `ls-files --others` + import trong screens | **`git add src/core`** sau review — tránh mất foundation |
| VIO policy: UI còn “VIG Token” | **P1** | `LoyaltyRewardsScreen`, `LocalScreen` | Task **VIO display cleanup** |
| Registry không nối navigation | **P1** | Không grep thấy `getVisibleMiniApps` ngoài registry | Task **Navigation Super App Lite Alignment** |
| `WalletService` / payment paths đụng trong cùng lúc schema/auth | **P0** | `WalletService.ts` + prisma M | **Review diff** trước khi chạy migrate hoặc deploy |
| Mất đồng bộ doc audit cũ | **P2** | `VIONA_VIO_DISPLAY` nói blueprint “không tìm thấy” — nay đã có file | Cập nhật audit sau (ngoài scope recovery) |

---

## 11. Recommended Next Step

**Chọn: E. Dừng để review thủ công** — sau đó **ngay lập tức** làm **git hygiene** (track `src/core/`, `docs/`, quyết định migration) **trước** bất kỳ Super App navigation lớn.

**Vì sao:** Tree đang gánh **nhiều stream** (auth/DB, flags/registry, VIO UI, broker, commercial). Tiếp tục code **C. Navigation Super App Lite Alignment** trên nền chưa commit **làm tăng chi phí review và rủi ro revert**. Sau khi review: ưu tiên **D. VIO Display cleanup** cho chỗ còn “VIG Token” public, rồi **C** để registry thành single source.

*(Nếu team đã cam kết chỉ làm product copy: có thể đổi thứ tự **D → E** nhẹ, nhưng **P0 DB/auth** vẫn nên review trước deploy.)*

---

## 12. Do Not Touch Next

- **`prisma/schema.prisma`** và **`prisma/migrations/*`** cho đến khi review + kế hoạch migrate rõ.
- **`src/controllers/AuthController.ts`**, **`EmailOtpService`**, **`authRoutes`** — tránh task song song không liên quan.
- **Payment / Stripe / webhook** (không mở rộng trong recovery này — **Chưa xác định** file cụ thể ngoài `WalletService` nếu có diff).
- **Global replace** tên VIG / VIO trong API/DB.
- **`package.json` / `package-lock.json`** — không nâng dependency “tiện tay”.

---

## Phụ lục — Output yêu cầu (tóm tắt cuối)

### 10 phát hiện quan trọng nhất

1. **Typecheck pass**; **lint 0 errors** (51 warnings).
2. **`src/core/` toàn bộ untracked** nhưng là foundation flags / registry / monetization.
3. **`docs/ai-context/` + nhiều `docs/audit/` untracked** — blueprint và audit đã có trên disk.
4. **Feature flags** khớp **Super App Lite default ON** + B2B automation env-off.
5. **Mini-app registry** phản ánh lite/pilot/frozen **nhưng chưa drive navigation**.
6. **VIO display:** **WalletTopUp** có disclaimer; **Loyalty + Local** còn **public “VIG Token”**.
7. **Legal scan:** flag default off; có gate trong **AIController** và **LocalScreen**.
8. **Broker:** client guard **`brokerQrEnabled`**; routes/screens trong danh sách thay đổi — cần review diff.
9. **Prisma + migration auth** mở trong tree — **P0** cho release.
10. **`git diff --name-only` vs `status`** lệch **`WalletService`** — cần xác minh local nếu quan trọng.

### Task tiếp theo được đề xuất

**E — Dừng để review thủ công**, kèm **add/track `src/core` + `docs`** và **nhóm commit** trước khi làm **C** hoặc **D**.

### Typecheck / lint

- **typecheck:** pass  
- **lint:** pass (0 errors, 51 warnings)
