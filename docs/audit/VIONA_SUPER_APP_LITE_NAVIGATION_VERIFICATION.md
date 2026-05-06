# VIONA Super App Lite Navigation Verification

**Auditor role:** Senior React Native Navigation Auditor (read-only).  
**Scope:** Post–Super App Lite alignment — `App.tsx`, `MainTabNavigator.tsx`, `mvpSurfaceGate.tsx`, `featureFlags.ts`, `miniAppRegistry.ts`, blueprint docs.  
**Date note:** Verification run against workspace state at audit time; `git status` reflects a mixed working tree (see §2).

---

## 1. Executive Summary

- **Navigation hiện có khớp Super App Lite không?**  
  **Phần lớn có.** Shell đã tách rõ **Travel Lite** (`travelLiteEnabled`), **Academy Lite** (`academyLiteEnabled`), **Leona Assistant Lite** (`leonaAssistantEnabled`) và **B2B AI Receptionist demo** (`b2bAiReceptionistDemoEnabled`). Luồng **travel trả phí** được bọc thêm lớp **`liveStripePaymentEnabled`**. **Cash out** gắn **`vigTokenEconomyEnabled`**. **InboundQueue** / **SmartCalendar** yêu cầu **demo hoặc pilot** B2B. Điều này khớp định hướng blueprint: mở Lite có kiểm soát, surface rủi ro dựa env explicit `"true"`.

- **Có route rủi ro nào còn lộ không?**  
  **Còn rủi ro tầng “sau navigator”:** `b2bAiReceptionistProductionEnabled` và các cờ con **`b2bAutoBookingEnabled` / `b2bAutoInventoryEnabled` / `b2bAutoBillPrintEnabled` / `b2bAutoPaymentEnabled`** **không** được kiểm tra trong `App.tsx` — chỉ được nhắc trong copy của gate B2B. **Vault**, **Wallet**, và nhiều màn B2B merchant vẫn mount không qua các cờ auto đó. **Admin** stack chỉ kiểm `adminDemoMetricsEnabled` + `isAdminDebugSurfaceEnabled`; **`omniDemoEnabled` không được dùng ở shell** (Omni có thể vẫn hiện trong `AdminDashboardScreen` tùy implementation). **Legal scan paid** không có route stack riêng trong `App.tsx`; luồng nằm ở `LocalScreen` với `legalScanEnabled` (mặc định off) — **khớp** với gate UI.

- **Có file untracked bắt buộc nào không?**  
  **Có.** `git status` cho thấy **`?? src/navigation/mvpSurfaceGate.tsx`** và **`?? src/core/`** (chứa `feature-flags`, `miniapps`, …). Đây là **rủi ro quy trình**: build/PR có thể thiếu file nếu clone không đồng bộ hoặc CI chỉ diff tracked files.

- **Có nên tiếp tục sang task AI Receptionist foundation không?**  
  **Nên, sau khi xử lý untracked + xác nhận gate production/sub-automation** (xem §9). Hành vi navigation Lite đã đủ để bắt đầu foundation **nếu** repo được làm sạch trạng thái git.

---

## 2. Git / File Status

### Lệnh đã chạy (read-only)

- `git status --short`
- `git diff --name-only`
- `npm run typecheck` → **exit code 0**
- `npm run lint` → **exit code 0** (0 errors, 51 warnings repo-wide)

### Files changed liên quan navigation (trong `git diff`, tracked)

| File |
|------|
| `App.tsx` |
| `src/navigation/MainTabNavigator.tsx` |
| `src/navigation/v7FourUniversesBlueprint.ts` |
| `src/screens/HomeScreen.tsx` |
| `src/screens/b2c/LocalScreen.tsx` |

*(Cùng lúc, working tree còn nhiều file modified khác: `package.json`, `prisma/schema.prisma`, broker, auth, v.v. — **ngoài phạm vi** chỉ audit navigation nhưng làm tăng nhiễu khi sign-off.)*

### Untracked files liên quan navigation / core

| Path | Ghi chú |
|------|---------|
| `src/navigation/mvpSurfaceGate.tsx` | **Bắt buộc** cho `mvpGateByFlag`, message Lite, `MvpSurfaceDisabledScreen` — hiện **`??`** |
| `src/core/` | **`??`** — gồm `feature-flags/featureFlags.ts`, `miniapps/miniAppRegistry.ts` mà audit dựa vào |
| `docs/ai-context/` | **`??`** — blueprint docs |
| `docs/audit/` | **`??`** — thư mục audit |

### Đặc biệt: `src/navigation/mvpSurfaceGate.tsx`

- File **được import** từ `App.tsx` (`mvpGateByFlag`, các `MVP_*_OFF_MSG`, `MvpSurfaceDisabledScreen`).
- **Git coi là untracked** trong snapshot hiện tại → **mâu thuẫn quản trị**: code phụ thuộc module chưa được track.
- Nội dung hiện tại: message tách Academy / Travel / Leona / B2B demo / live payment / token economy; hàm `mvpGateByFlag` đọc `getFeatureFlags()`.

---

## 3. Flags Verification

Nguồn: `src/core/feature-flags/featureFlags.ts` (trong `src/core/` — **untracked tại thời điểm audit**).

| Feature | Flag | Expected Default (theo code) | Current Behavior | Match? |
|---------|------|------------------------------|------------------|--------|
| Hub | `hubEnabled` | `true` | Tab + stack Hub | Yes |
| Local | `localEnabled` | `true` | Tab Local; `LocalUniverse` không bọc gate riêng trong `App.tsx` | Yes* |
| Travel Lite | `travelLiteEnabled` | `true` | Tab Travel + travel stack screens gated | Yes |
| Academy Lite | `academyLiteEnabled` | `true` | Academy stack gated | Yes |
| Leona Lite | `leonaAssistantEnabled` | `true` | `LeonaCall`, `LiveInterpreter`, `RadarDiscovery` gated | Yes |
| B2B AI Receptionist Demo | `b2bAiReceptionistDemoEnabled` | `true` | `AiEye` gated; copy nhắc tách khỏi Leona | Yes |
| B2B AI Receptionist Pilot | `b2bAiReceptionistPilotEnabled` | env `"true"` | Mở `SmartCalendar` / `InboundQueue` khi demo off nhưng pilot on | Yes |
| B2B AI Receptionist Production | `b2bAiReceptionistProductionEnabled` | env `"true"` | **Không** thấy gate trong `App.tsx` | **No** |
| Live Stripe Payment | `liveStripePaymentEnabled` | env `"true"` | Lồng vào checkout / flight / hospitality / fixer paid / earnings / booking confirmed | Yes |
| VIO Token Economy | `vigTokenEconomyEnabled` | env `"true"` | `CashOut` gated; Vault/Wallet không gate ở stack | Partial |
| Broker QR | `brokerQrEnabled` | env `"true"` | Broker tabs hoặc disabled surface | Yes |
| Legal Scan | `legalScanEnabled` | env `"true"` | UI `LocalScreen` (không phải stack gate `App.tsx`) | Yes* |
| Payroll | `payrollEnabled` | env `"true"` | Không thấy route payroll trong `App.tsx` | Yes* |
| Admin Demo | `adminDemoMetricsEnabled` | env `"true"` | Admin stack + `isAdminDebugSurfaceEnabled()` | Yes |
| KOL Demo | `kolDemoEnabled` | env `"true"` | `GatedKOLPartnerDashboardScreen` | Yes |
| Omni Demo | `omniDemoEnabled` | env `"true"` | **Không** dùng trong điều kiện mount stack `App.tsx` | **No** |

\*Local universe screen mount trực tiếp `LocalScreen` — gate legal scan nằm trong màn. \*Payroll: không có route rõ trong navigator đã rà.

---

## 4. Route Verification

Nguồn chính: `App.tsx` (`Travel*Gated`, `*ScreenGated`, `Gated*` wrappers), `MainTabNavigator.tsx`.

| Route/Screen | Category | Required Flag(s) | Current Gate | Risk | Recommendation |
|--------------|----------|------------------|--------------|------|----------------|
| TravelCompanion | Travel Lite | `travelLiteEnabled` | `mvpGateByFlag('travelLiteEnabled', …)` | Low | OK; nội bộ có `navigate('FlightSearchAssistant')` — destination vẫn bị gate |
| TravelHub | Travel Lite | `travelLiteEnabled` | Same | Low | OK |
| VietnamHub | Travel Lite | `travelLiteEnabled` | Same | Low | OK |
| ViralWrap | Travel Lite | `travelLiteEnabled` | Same | Low | OK |
| TravelSosHub | Travel Lite | `travelLiteEnabled` | Same | Low | OK |
| LocalFixer | Travel Lite | `travelLiteEnabled` | Same | Low | OK |
| TourismCheckout | Travel paid | `travelLiteEnabled` + `liveStripePaymentEnabled` | Nested `mvpGateByFlag` | Low | OK cho blueprint “no fake live payment” |
| LocalFixerCheckout | Travel paid | Both | Nested | Low | OK |
| FlightSearchAssistant | Travel paid | Both | Nested | Med | Cân nhắc tách “search lite” sau nếu product cần browse không Stripe |
| TravelFlightSearch | Travel paid | Both | `FlightSearchScreenGated` | Med | Same |
| TravelHospitality | Travel paid | Both | `TravelHospitalityScreenGated` | Low | OK |
| FixerEarnings | Travel paid | Both | `FixerEarningsScreenGated` | Low | OK |
| TourismBookingConfirmed | Travel paid | Both | `TourismBookingConfirmedScreenGated` | Med | Deep link sau booking có thể gặp disabled nếu Stripe off — chấp nhận được cho an toàn |
| AdultLearningHome / KidsLearningHome / VietKids / KidsLeaderboard | Academy | `academyLiteEnabled` | `mvpGateByFlag` | Low | OK |
| LiveAiTeacher | Academy | `academyLiteEnabled` | `LiveAiTeacherScreenGated` | Med | Navigator không gắn nhãn “beta” — có thể bổ sung sau ở screen options |
| LeonaCall | Leona Lite | `leonaAssistantEnabled` | `LeonaCallScreenGated` | Med | **Production phone** không gate `b2bAiReceptionistProductionEnabled` ở shell |
| LiveInterpreter | Leona Lite | `leonaAssistantEnabled` | Gated | Low | OK |
| RadarDiscovery | Leona Lite | `leonaAssistantEnabled` | Gated | Low | OK |
| AiEye | B2B demo | `b2bAiReceptionistDemoEnabled` | Gated | Low | OK — tách khỏi Leona |
| SmartCalendar | B2B | `b2bAiReceptionistDemoEnabled` **or** `b2bAiReceptionistPilotEnabled` + workspace | `GatedSmartCalendarScreen` | Med | Auto-* flags không gate navigator |
| InboundQueue | B2B | Same + workspace | `GatedInboundQueueScreen` | Med | Same |
| CashOut | Token economy | `vigTokenEconomyEnabled` | `CashOutScreenGated` | Low | OK |
| Broker tabs | Broker | `brokerQrEnabled` | `MainTabNavigator` | Low | OK |
| AdminDashboard (+ sub-screens) | Admin demo | `isAdminDebugSurfaceEnabled()` && `adminDemoMetricsEnabled` | Conditional stack | Med | **`omniDemoEnabled` không tách** |
| KOLPartnerDashboard | KOL | `kolDemoEnabled` + workspace | `GatedKOLPartnerDashboardScreen` | Low | OK |

---

## 5. Deep Link / Internal Navigation Risk

- **Deep link:** `rootLinking` trong `App.tsx` map URL tới tên route (ví dụ `tourism-checkout`, `AiEye`, `LeonaCall`). Khi mở URL, **component vẫn là bản đã gate** → màn `MvpSurfaceDisabledScreen` nếu flag off → **stack gate chặn mount nội dung thật**.
- **Navigate trực tiếp từ màn khác:** Nhiều file gọi `navigation.navigate('LeonaCall' | 'AiEye' | 'CashOut' | 'InboundQueue' | 'SmartCalendar' | 'TravelFlightSearch' | 'TourismCheckout' | …)` (ví dụ `HocTapScreen` → `AiEye`, `MerchantDashboard` → `InboundQueue`, `TravelCompanion` → `FlightSearchAssistant`, `SetupProfile` → `AiEye`/`LeonaCall`, `ConciergeScreen` → B2B routes). **Hành vi:** điều hướng vẫn xảy ra nhưng **màn đích bọc gate** → không mount logic production khi flag false; UX có thể là “vào route rồi thấy thông báo tắt”.
- **CTA dẫn vào feature disabled:** Hub/`HomeScreen` và `LocalScreen` đã chỉnh pre-check cho Leona vs B2B demo (theo diff); các màn khác có thể vẫn bấm được nhưng **an toàn nhờ gate stack** — rủi ro chủ yếu là **trải nghiệm**, không phải bypass flag.

---

## 6. B2B AI Receptionist Safety Boundary

- **Navigation có chỉ mở demo/pilot surface không?**  
  **Ở lớp `SmartCalendar` / `InboundQueue`:** có — cần **`b2bAiReceptionistDemoEnabled` hoặc `b2bAiReceptionistPilotEnabled`**, cộng **`B2BWorkspaceGate`**.

- **Có mở production phone automation không?**  
  **Không được điều khiển bởi `App.tsx` qua `b2bAiReceptionistProductionEnabled`.** Nếu automation gắn vào implementation `SmartCalendarScreen` / `InboundQueueScreen` / `LeonaCallScreen`, đó là **rủi ro ngoài phạm vi navigator** đã audit.

- **Có route nào có thể kích hoạt payment/inventory/bill/booking automation không?**  
  **Navigator không kiểm `b2bAutoBookingEnabled` / `b2bAutoInventoryEnabled` / `b2bAutoBillPrintEnabled` / `b2bAutoPaymentEnabled`.** Các route B2B merchant (`Orders`, `WalletB2B`, v.v.) vẫn mount qua workspace gate — **khả năng kích hoạt automation nằm trong screen/service**, không bị chặn bởi stack hiện tại.

---

## 7. Typecheck / Lint

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** (exit code 0) |
| `npm run lint` | **PASS** với **51 warnings**, **0 errors** (toàn repo; không phải regression navigation-only) |

---

## 8. Remaining Risks

| Priority | Risk | Evidence | Recommended Next Step |
|----------|------|----------|------------------------|
| P0 | Module gate + core flags **untracked** | `git status`: `?? src/navigation/mvpSurfaceGate.tsx`, `?? src/core/` | Track files trong git; một PR “chỉ infrastructure” trước khi foundation |
| P0 | `b2bAiReceptionistProductionEnabled` không gate shell | `App.tsx` không tham chiếu flag này | Wire gate hoặc xác nhận bằng policy: chỉ server + screen logic |
| P1 | Auto B2B sub-flags không gate navigator | `featureFlags.ts` có `b2bAuto*`; `App.tsx` không dùng | Rà `SmartCalendar` / `Orders` / merchant flows — gate UI hoặc API |
| P1 | `omniDemoEnabled` không tách admin shell | Admin stack chỉ `adminDemoMetricsEnabled` | Đọc `AdminDashboardScreen`; wire `omniDemoEnabled` nếu blueprint yêu cầu tách |
| P2 | Vault / Wallet không gate `vigTokenEconomyEnabled` | `VaultScreen`, `WalletScreen` raw trong stack | Xác nhận product: có cần gate Vault khi economy off |
| P2 | Flight search = paid gate | `FlightSearchScreenGated` yêu cầu `liveStripePaymentEnabled` | Product: có cần “search lite” không Stripe |
| P2 | Nhiều `navigate(...)` không pre-check flag | grep `navigate('LeonaCall'` etc. | Giữ gate stack (OK) hoặc thêm alert sớm cho UX |
| P3 | `bookingEnabled` trong flags, ít dùng trong shell | `miniAppRegistry` vs `App.tsx` | Tài liệu hóa mapping booking → flow nào (Local/Merchant) |
| P3 | Brand blueprint VIONA vs copy maintenance | `AppStateView` maintenance string | Roadmap rebrand — không chặn navigation audit |
| P3 | Working tree lớn ngoài navigation | `git diff` nhiều domain | Giảm nhiễu trước khi merge Lite |

---

## 9. Final Recommendation

**C. Cần xử lý untracked file trước.**

Lý do: `mvpSurfaceGate.tsx` và `src/core/` là **đường dẫn bắt buộc** cho typecheck/build hiện tại nhưng **chưa tracked** — sign-off “navigation khớp blueprint” trên repo sạch **chưa đạt** cho đến khi các file này nằm trong VCS. Sau khi track, có thể coi hành vi Lite **đủ tốt** để chuyển **B2B AI Receptionist foundation** kèm follow-up **P0/P1** (production flag + auto-*) trong task kế tiếp.

---

## Phụ lục — Top 10 navigation risks (tóm tắt)

1. **`mvpSurfaceGate.tsx` + `src/core/` untracked** — rủi ro PR/build.  
2. **`b2bAiReceptionistProductionEnabled` không có trong `App.tsx` gates.**  
3. **`b2bAuto*` không gate ở navigator** — automation có thể bật từ màn B2B.  
4. **`omniDemoEnabled` không kiểm soát shell admin.**  
5. **Vault/Wallet không gate token economy** ở stack (chỉ CashOut).  
6. **Nhiều `navigate` không pre-check** — dựa hoàn toàn vào gate màn đích (UX).  
7. **Flight / assistant gắn chặt `liveStripePaymentEnabled`** — có thể quá chặt cho “search lite”.  
8. **`TourismBookingConfirmed` gated paid** — deep link edge case.  
9. **`bookingEnabled` vs shell** — có thể gây hiểu nhầm registry vs routes.  
10. **Working tree lớn** — khó cô lập regression navigation.

**Recommendation letter:** **C**
