# VIONA Change Grouping Audit

**Vai trò:** Release Manager + Git Hygiene Auditor (read-only).  
**Snapshot:** lệnh git chạy cùng phiên tạo file này.  
**Quy ước:** Không dán secret; “Safe To Commit?” = sau khi **review nội dung** phù hợp nhóm — không thay thế QA/production gate.

---

## 1. Executive Summary

- **Working tree có an toàn để tiếp tục code chưa?** **Chưa hoàn toàn.** Typecheck/lint pass không đủ: tree **trộn** auth/Prisma, navigation, VIO copy, broker/legal gates, và **~30 file tracked diff** + **nhiều untracked** (`src/core/`, docs, migration). Nên **gom nhóm / review** trước khi code thêm.
- **Có nên commit/backup theo nhóm không?** **Có.** Tách **Group F (Auth/Prisma/migration)** khỏi UI/docs/core giúp review rõ và rollback an toàn.
- **Nhóm rủi ro nhất là gì?** **Group F** (`prisma/schema.prisma`, migration untracked, `AuthController`, `EmailOtpService`, routes/middleware validation) + **`WalletService.ts`** (status `M` nhưng **Chưa xác định** nội dung diff so với HEAD — xem §3 Group G).
- **Task code tiếp theo sau khi ổn định repo là gì?** Ưu tiên **C — Auth/Prisma manual review** (và quyết định migrate/backup DB), sau đó **A — Finish VIO cleanup** (còn public “VIG Token”) rồi **B — Navigation Super App Lite Alignment** (chi tiết §6).

---

## 2. Full Git Snapshot

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

*(working tree vs index; cảnh báo CRLF có thể in ra stderr)*

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

*Ghi chú:* **`src/services/WalletService.ts`** xuất hiện trong `git status` (**M**) nhưng **không** có trong `git diff --name-only` / `--stat` thu được — **Chưa xác định** (khác index vs CRLF / công cụ). Cần xác minh local: `git diff -- src/services/WalletService.ts` và `git diff HEAD -- src/services/WalletService.ts`.

### `git diff --stat`

```
 App.tsx                                           | 124 ++++++++++++---
 package-lock.json                                 |  10 ++
 package.json                                      |   1 +
 prisma/schema.prisma                              |  25 +++
 src/app.ts                                        |   5 +-
 src/components/academy/KidsInteractiveMode.tsx    |   2 +-
 src/controllers/AIController.ts                   |  13 ++
 src/controllers/AuthController.ts                 |  11 +-
 src/i18n/strings.ts                               | 126 ++++++++-------
 src/middleware/RateLimitMiddleware.ts             |   8 +-
 src/navigation/MainTabNavigator.tsx               | 184 ++++++++++++++--------
 src/routes/authRoutes.ts                          |  12 +-
 src/routes/brokerRoutes.ts                        |  19 ++-
 src/screens/HocTapScreen.tsx                      |  15 +-
 src/screens/HomeScreen.tsx                        | 116 +++++++++-----
 src/screens/WalletTopUpScreen.tsx                 | 133 ++++++++++------
 src/screens/academy/LiveAiTeacherScreen.tsx       |   3 +-
 src/screens/admin/AdminDashboardScreen.tsx        |   2 +-
 src/screens/b2c/DashboardB2CScreen.tsx            |  67 +++++---
 src/screens/b2c/LocalScreen.tsx                   |  70 +++++---
 src/screens/b2c/LoyaltyRewardsScreen.tsx          |  26 +--
 src/screens/b2c/academy/VietKidsScreen.tsx        |   5 +-
 src/screens/broker/BrokerCommissionsTabScreen.tsx |  17 +-
 src/screens/broker/BrokerDashboardScreen.tsx      |  15 +-
 src/screens/commercial/AngelInvestmentHub.tsx     |   6 +-
 src/services/api/BookingService.ts                |   9 +-
 src/services/api/BrokerService.ts                 |   9 ++
 src/services/auth/EmailOtpService.ts              |  13 +-
 src/types/express-augment.d.ts                    |  18 ++-
 testOtpRateLimit.js                               |   4 +-
 30 files changed, 732 insertions(+), 336 deletions(-)
```

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

*Sau khi thêm file này:* `docs/audit/VIONA_CHANGE_GROUPING_AUDIT.md` sẽ xuất hiện trong `docs/audit/` (untracked cho đến khi `git add`).

---

## 3. Change Groups

### Group A — Documentation

Bao gồm: `docs/ai-context/*`, `docs/audit/*` (theo `git ls-files --others`).

| File | Purpose | Safe To Commit? | Notes |
|------|---------|-----------------|-------|
| `docs/ai-context/AI_RULES.md` | Quy tắc AI | Có (sau skim) | Docs-only |
| `docs/ai-context/API_REFERENCE.md` | Tham chiếu API | Có | Docs-only |
| `docs/ai-context/ARCHITECTURE.md` | Kiến trúc | Có | Docs-only |
| `docs/ai-context/B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE.md` | B2B receptionist | Có | Align blueprint |
| `docs/ai-context/CURRENT_STATE.md` | Trạng thái | Có | Có thể lỗi thời — review |
| `docs/ai-context/DATA_MODEL.md` | Data model | Có | Docs-only |
| `docs/ai-context/MINI_APP_PLATFORM_ARCHITECTURE.md` | Mini-app platform | Có | Align registry task |
| `docs/ai-context/PROJECT_CONTEXT.md` | Context dự án | Có | Docs-only |
| `docs/ai-context/ROADMAP.md` | Lộ trình | Có | Docs-only |
| `docs/ai-context/SESSION_LOG.md` | Session log | Có | Có thể cá nhân hóa — review |
| `docs/ai-context/SETUP.md` | Setup | Có | Docs-only |
| `docs/ai-context/TASK_HANDOFF_TEMPLATE.md` | Handoff template | Có | Docs-only |
| `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md` | Blueprint VIONA | Có | Nguồn truth sản phẩm |
| `docs/ai-context/VIONA_MONETIZATION_ZERO_LOSS_ENGINE.md` | Zero-loss / VIO | Có | Policy |
| `docs/audit/VIONA_CODEBASE_AUDIT.md` | Audit codebase | Có | |
| `docs/audit/VIONA_CURSOR_STATE_RECOVERY_AUDIT.md` | Recovery snapshot | Có | |
| `docs/audit/VIONA_FEATURE_GATE_ENTRYPOINT_AUDIT.md` | Feature gates | Có | |
| `docs/audit/VIONA_REPO_STATE_LOCK.md` | Lock state cũ | Có | Có thể supersede bởi audit mới |
| `docs/audit/VIONA_RESIDUAL_SURFACE_AUDIT.md` | Residual surfaces | Có | |
| `docs/audit/VIONA_VIO_DISPLAY_SURFACE_AUDIT.md` | VIO display audit | Có | |
| `docs/audit/VIONA_CHANGE_GROUPING_AUDIT.md` | **File này** | Có | Nhóm thay đổi / hygiene |

---

### Group B — Core Foundation

Bao gồm: `src/core/brand/*`, `src/core/feature-flags/*`, `src/core/miniapps/*`, `src/core/monetization/*` (untracked).

| File | Purpose | Safe To Commit? | Notes |
|------|---------|-----------------|-------|
| `src/core/brand/brandConfig.ts` | Brand hiển thị | Có | Phụ thuộc consumer đã import |
| `src/core/feature-flags/featureFlags.ts` | Feature flags Super App Lite | Có | App import — **phải commit cùng app** hoặc break build nếu thiếu |
| `src/core/miniapps/miniAppRegistry.ts` | Registry mini-app | Có | Chưa drive nav đầy đủ |
| `src/core/miniapps/miniAppTypes.ts` | Types registry | Có | |
| `src/core/monetization/index.ts` | Re-export | Có | |
| `src/core/monetization/vioDisplayConfig.ts` | Tên public VIO | Có | |
| `src/core/monetization/vioDisplayLabels.ts` | Helper format/label | Có | |
| `src/core/monetization/consumerPlans.ts` | Plans B2C | Có | **Chưa xác định** đã dùng hết chưa |
| `src/core/monetization/costFirewallConfig.ts` | Cost firewall config | Có | |
| `src/core/monetization/merchantPlans.ts` | Plans merchant | Có | |
| `src/core/monetization/monetizationTypes.ts` | Types | Có | |
| `src/core/monetization/zeroLossPolicy.ts` | Zero-loss policy | Có | |

---

### Group C — P0 Safety Gates

File đã sửa / liên quan **Legal Scan kill switch**, **Broker client guard**, **Broker API / booking gate** (theo path + grep cục bộ).

| File | Safety Gate | Risk | Safe To Commit? |
|------|-------------|------|-----------------|
| `src/controllers/AIController.ts` | Legal Scan (server) | Trung–cao | Có sau review hành vi 403/off |
| `src/screens/b2c/LocalScreen.tsx` | Legal Scan (UI) + copy | Trung | Có; trùng Group E (copy) |
| `src/routes/brokerRoutes.ts` | Broker API kill switch | Cao | Có sau review route mount |
| `src/services/api/BrokerService.ts` | Broker side-effect guard (`brokerQrEnabled`) | Cao | Có sau review |
| `src/services/api/BookingService.ts` | Broker path khi `brokerQrEnabled` | Trung–cao | Có sau review |

---

### Group D — Navigation Gates

| File | Change Type | Risk | Safe To Commit? |
|------|-------------|------|-----------------|
| `App.tsx` | Shell / navigation wiring lớn (+124 dòng net) | Cao | Có sau review UX + flags |
| `src/navigation/MainTabNavigator.tsx` | Tabs, feature flags, import `mvpSurfaceGate` | Cao | Có sau review |
| `src/navigation/mvpSurfaceGate.tsx` | **Untracked** — gate MVP surface | Trung | **Phải add** cùng commit nav nếu import đang trỏ tới |

---

### Group E — VIO Display / Copy Safety

| File | Display Change | Remaining VIG Public? | Safe To Commit? |
|------|----------------|------------------------|-----------------|
| `src/i18n/strings.ts` | Wallet / disclaimer VIO | **Chưa xác định** toàn file | Có sau grep “VIG Token” |
| `src/screens/WalletTopUpScreen.tsx` | VIO Credits + disclaimer | Không rõ mọi chuỗi | Có (ưu tiên review payment copy) |
| `src/screens/HomeScreen.tsx` | VIO pill / hub | **Chưa xác định** hết | Có |
| `src/screens/b2c/DashboardB2CScreen.tsx` | VIO Points / hub | **Chưa xác định** hết | Có |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | Một phần VIO | **Có** — “VIG Token” title/sub | Nên **hoàn tất cleanup** trước hoặc commit có nợ |
| `src/screens/b2c/LocalScreen.tsx` | Legal + classified | **Có** — “VIG Token” classified | Giống trên |
| `src/screens/HocTapScreen.tsx` | VIO Credits alerts | Không rõ | Có |
| `src/screens/academy/LiveAiTeacherScreen.tsx` | `getVioCreditsLabel` | Không rõ | Có |
| `src/screens/b2c/academy/VietKidsScreen.tsx` | `formatVioPoints` | Internal `vigTokensAdded` | Có |
| `src/screens/broker/BrokerCommissionsTabScreen.tsx` | Demo VIO copy | Internal mock | Có |
| `src/screens/broker/BrokerDashboardScreen.tsx` | Demo payout | Tên biến `MOCK_*_VIG` | Có (display đã hướng VIO) |
| `src/screens/admin/AdminDashboardScreen.tsx` | Thay đổi nhỏ | **Chưa xác định** | Review — có thể KPI nội bộ |
| `src/screens/commercial/AngelInvestmentHub.tsx` | Copy thương mại | **Chưa xác định** VIG/VIO | Review |
| `src/components/academy/KidsInteractiveMode.tsx` | Thay đổi nhỏ | **Chưa xác định** | Có thể academy/VIO |

---

### Group F — Auth / OTP / Prisma / Migration

| File | Area | Risk | Should Be Separate Commit? | Needs Manual Review? |
|------|------|------|----------------------------|----------------------|
| `prisma/schema.prisma` | DB schema (+25 dòng) | **P0** | **Có** | **Có** |
| `prisma/migrations/20260503120000_auth_refresh_session/migration.sql` | Migration | **P0** | **Có** | **Có** |
| `src/controllers/AuthController.ts` | Auth API | **P0** | **Có** | **Có** |
| `src/services/auth/EmailOtpService.ts` | OTP | **P0** | **Có** | **Có** |
| `src/routes/authRoutes.ts` | Routes | **P0** | **Có** | **Có** |
| `src/middleware/validateBody.ts` | Zod body (**untracked**) | Cao | **Có** | **Có** |
| `src/validation/authSchema.ts` | Zod schema (**untracked**) | Cao | **Có** | **Có** |
| `src/middleware/RateLimitMiddleware.ts` | Rate limit | Cao | **Có** | **Có** |
| `src/types/express-augment.d.ts` | Types Express | Trung | Cùng commit auth nếu liên quan | Có |
| `src/app.ts` | Mount middleware / routes | Cao | Cùng hoặc sau F | Có |
| `package.json` | +1 dòng (dep/script) | Trung | Cùng F nếu zod/validation | Có |
| `package-lock.json` | Lock | Trung | Cùng `package.json` | Có |
| `testOtpRateLimit.js` | Script test OTP | Thấp–trung | Có thể tách | Có |

---

### Group G — Unknown / Needs Confirmation

| File | Why Unknown | Recommendation |
|------|-------------|----------------|
| `src/services/WalletService.ts` | `git status` = **M** nhưng không có trong `git diff --name-only`/`--stat`; `git diff HEAD` không in patch trong phiên này | Chạy local: `git diff`, `git diff HEAD`, kiểm tra CRLF; **không** merge nhóm wallet cho đến khi diff rõ |
| `src/screens/admin/AdminDashboardScreen.tsx` | Thay đổi nhỏ; có thể KPI “VIG” nội bộ hoặc khác | Đọc diff; gán E hoặc “admin internal only” |
| `src/screens/commercial/AngelInvestmentHub.tsx` | Có thể VIO hoặc đầu tư/commercial tách biệt | Đọc diff; không gộp nhầm vào VIO nếu scope khác |

---

## 4. Files That Must Not Be Touched Next

- **`prisma/schema.prisma`** và **`prisma/migrations/*`** — không chỉnh tay thêm cho đến khi review xong Group F.
- **`src/controllers/AuthController.ts`**, **`EmailOtpService.ts`**, **`authRoutes`** — không task song song không liên quan.
- **`src/services/WalletService.ts`** — không đụng cho đến khi **diff rõ** (tránh sửa wallet math lẫn với copy).
- **`package.json` / `package-lock.json`** — không nâng dependency “dọn dẹp” khi đang chuẩn bị commit có kiểm soát.

---

## 5. Recommended Commit / Backup Order

*(Chỉ đề xuất — **không** chạy `git write` trong task này.)*

1. **Backup nhánh / tag** (local hoặc remote) trên trạng thái hiện tại nếu cần rollback.
2. **Group A — Documentation** (commit docs + audit, ít rủi ro runtime).
3. **Group B — Core foundation** (`src/core/**` + bất kỳ file untracked mà app đã import — tránh build gãy).
4. **Group F — Auth / Prisma / migration / validation / rate limit / `app.ts` / package** — **một hoặc nhiều commit tách biệt**, review thủ công, quyết định `migrate` riêng.
5. **Group C — P0 safety gates** (AI legal, broker routes/service, booking broker hook) — có thể gộp với F nếu cùng PR bảo mật; tách nếu muốn review nhanh UI.
6. **Group E — VIO display** (ưu tiên xóa nợ “VIG Token” Loyalty/Local trước khi release copy).
7. **Group D — Navigation + `App.tsx` + `mvpSurfaceGate.tsx`** (sau khi foundation đã trong repo).
8. **Group G — `WalletService` / admin / angel** — chỉ sau khi phân loại xong diff.

---

## 6. Immediate Next Code Task After Stabilization

**Chọn: C — Auth/Prisma manual review**

**Vì sao:** Schema + migration + OTP/auth là **P0**; sai lệch ở đây ảnh hưởng toàn hệ (DB, session, bảo mật). UI/VIO/navigation nên xây trên nền auth/DB đã **đóng gói và review**. Sau C: **A — Finish VIO cleanup** (public “VIG Token” còn sót), rồi **B — Navigation Super App Lite Alignment**.

---

## 7. Final Recommendation

- **Có nên code tiếp ngay không?** **Không nên** cho đến khi **phân nhóm + review** (ít nhất **F** và **G/WallletService**). Có thể **chỉ** sửa doc/audit nếu được phép ngoài “no code” policy của sprint.
- **Có nên tách auth/prisma/migration khỏi các thay đổi khác không?** **Có** — commit/PR riêng giúp revert và audit compliance.
- **Có nên xử lý VIG public còn sót trước navigation không?** **Nên** về mặt **product safety** (Loyalty/Local); lệ thuộc release: nếu ship nav trước, vẫn **ưu tiên** pass VIO cleanup **P1** trước marketing/production có người dùng mới.

---

## Phụ lục — Output yêu cầu (tóm tắt)

### Recommended commit/backup order

1. Backup nhánh/tag  
2. **A** Documentation  
3. **B** Core foundation  
4. **F** Auth / Prisma / migration / validation (tách biệt, review)  
5. **C** Safety gates (legal / broker / booking)  
6. **E** VIO display (hết nợ copy)  
7. **D** Navigation + App shell  
8. **G** sau khi làm rõ diff  

### Files P0 cần review thủ công

- `prisma/schema.prisma`
- `prisma/migrations/20260503120000_auth_refresh_session/migration.sql`
- `src/controllers/AuthController.ts`
- `src/services/auth/EmailOtpService.ts`
- `src/routes/authRoutes.ts`
- `src/middleware/RateLimitMiddleware.ts`
- `src/middleware/validateBody.ts` (untracked)
- `src/validation/authSchema.ts` (untracked)
- `src/app.ts`
- `src/services/WalletService.ts` (**Chưa xác định** diff — vẫn coi P0 cho đến khi loại trừ thay đổi logic)

### Next code task

**C — Auth/Prisma manual review** (sau đó **A — VIO cleanup**, rồi **B — Navigation alignment**).
