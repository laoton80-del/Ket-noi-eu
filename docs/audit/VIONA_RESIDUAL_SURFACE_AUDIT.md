# VIONA Residual Surface Audit

**Loại:** Post–P0-3 Navigation MVP Gate — chỉ đọc code, không sửa repo trong task này.  
**Mục tiêu:** Liệt kê route/màn vẫn có thể lộ ngoài MVP qua deep link, stack, đổi role, hoặc nút trong màn chưa gate.

---

## 1. Executive Summary

| Câu hỏi | Trả lời |
|---------|--------|
| **Còn route ngoài MVP có thể truy cập không?** | **Có.** Nhiều `Stack.Screen` vẫn đăng ký không bọc `mvpGateByFlag`; một số đường từ Home/Local/Radar/Services vẫn `navigate()` tới travel/AI/wallet/admin-sized surfaces. Đặc biệt **`VietnamHub` trong `App.tsx` khai báo `VietnamHubScreenGated` nhưng `Stack.Screen` vẫn dùng `component={VietnamHubScreen}`** — inbound tourism hub có thể lộ khi `travelEnabled === false`. |
| **Route nguy hiểm nhất (residual)?** | **`VietnamHub`** (thiếu áp gate đã định nghĩa) + **`Wallet` / `LoyaltyRewards`** (economy token không có `vigTokenEconomyEnabled` ở navigation) + **`RadarDiscovery`** / **`LifeOSDashboard`** (surface rộng, gateway tới Leona/merchant/wallet). |
| **Route nên giữ (MVP / safety)?** | **`Tabs` (Home/Local khi bật cờ)** booking flow trong shell B2C; **`EmergencySOS`** / **`SOSModal`** / **`LiveInterpreter`** phần an toàn (không gộp du lịch demo vào đây); **`Login`/`Otp`/`RoleSelection`**; stack **`MerchantDashboard`** B2B khi merchant MVP — **Chưa xác định** toàn bộ copy tiền trong từng màn. |
| **Cần gate tiếp?** | Travel stack còn lệch gate (`VietnamHub`); UI trong Home/`DashboardB2CScreen`/`LocalScreen` chưa ẩn shortcut khi cờ tắt (stack có thể đã disabled nhưng UX vẫn gọi navigate); **`bookingEnabled`** chưa gắn navigation; **B2B** advanced (`InternalTradeMarket`, `AdBidding`, …) chưa có cờ riêng trong P0-3. |

---

## 2. Current MVP Surface (khi env optional = false, mặc định trong `featureFlags`)

Tham chiếu: `getFeatureFlags()` — `hubEnabled` / `localEnabled` / `bookingEnabled` / `merchantDashboardEnabled` = **true** cố định; travel/academy/broker/AI admin demo/KOL = **false** trừ khi `EXPO_PUBLIC_*=true`.

### B2C tabs (`MainTabNavigator.tsx`)

- **Còn mount:** `TabHome`, `TabLocal` (nếu `hubEnabled` / `localEnabled`).
- **Không mount:** `TabTravel`, `TabAi` khi `travelEnabled` / `academyEnabled` false.

### B2B tabs

- **Còn:** Bốn tab merchant khi `merchantDashboardEnabled` true (mặc định); nếu false → placeholder “Merchant workspace…” trên từng tab wrapper.

### Broker

- **`brokerQrEnabled` false:** chỉ một tab `TabRadar` → `BrokerRoleMvpDisabledSurface`.
- **`brokerQrEnabled` true:** đủ 5 tab broker.

### Admin

- **`TabCommandCenter`** vẫn cho role `ADMIN` — **không** phụ thuộc `adminDemoMetricsEnabled` (đúng cho admin thật).

### Stack routes vẫn **registered** trong `App.tsx` (luôn có trong navigator khi user vào app)

Nhóm vẫn tồn tại kể cả khi tab travel/academy ẩn: ví dụ `LifeOSDashboard`, `RadarDiscovery`, `LeonaCall`, `Wallet`, `LoyaltyRewards`, `VietnamHub` (component raw — xem mục 3), `EmergencySOS`, `SmartCalendar` (đã `GatedSmartCalendarScreen`), `KOLPartnerDashboard` (đã gate `kolDemoEnabled`), travel đã gate qua `mvpGateByFlag` **trừ** mismatch `VietnamHub`.

---

## 3. Residual Route Table

| Route/Screen | File | Current Access Path | Feature Category | Current Gate | Risk | Recommended Action |
|--------------|------|---------------------|------------------|--------------|------|---------------------|
| **Tabs / TabHome** | `MainTabNavigator.tsx` | Tab bar, deep link `home` | MVP core | `hubEnabled` | Low | keep |
| **Tabs / TabLocal** | `MainTabNavigator.tsx` | Tab bar, deep link `local` | MVP core | `localEnabled` | Low | keep |
| **Tabs / TabTravel** | `MainTabNavigator.tsx` | Tab bar, link `travel` | travel | Tab chỉ mount khi `travelEnabled` | Medium | keep — deep link risk if tab unmounted (see §4) |
| **Tabs / TabAi** | `MainTabNavigator.tsx` | Tab bar, link `ai` | academy | Tab chỉ mount khi `academyEnabled` | Medium | gate_with_flag — redirect/link policy §4 |
| **Tabs / broker\*** | `MainTabNavigator.tsx` | Tab bar, links `broker`, … | broker | Broker tabs full chỉ khi `brokerQrEnabled`; else 1 tab disabled | Low | keep |
| **VietnamHub** | `App.tsx` ~L320 | `LocalScreen` → navigate; deep link `VietnamHub` | travel | **`Stack` dùng `VietnamHubScreen` — KHÔNG dùng `VietnamHubScreenGated` đã định nghĩa** | **High** | **gate_with_flag** — sửa dùng gated component (task sau) |
| **TravelHub** | `App.tsx` | Stack + `DashboardB2CScreen`, Home | travel | `mvpGateByFlag('travelEnabled')` | Low (stack) | keep |
| **TravelCompanion** | `App.tsx` | Home CTA; deep link | travel | gated | Low | keep |
| **TourismCheckout / Confirmed / ViralWrap / …** | `App.tsx` | Chuỗi du lịch | travel | gated | Low | keep |
| **TravelSosHub** | `App.tsx` | Travel SOS hub | travel | gated | Low — đừng nhầm **EmergencySOS** | keep |
| **LifeOSDashboard** | `App.tsx` | `ServicesScreen`, `TienIchScreen`, … | unknown / Life OS | **Không có feature flag** | Medium | needs_manual_review hoặc gate travel/life bundle |
| **RadarDiscovery** | `App.tsx` | Pilot/Radar flows; `SetupProfile`, Services | ai / local discovery | **Không gate P0-3** | High | gate_with_flag hoặc `needs_manual_review` — exposure Leona + merchant |
| **LeonaCall** | `App.tsx` | Home proactive, Local, Radar, EmergencySOS, … | ai | **Không** `aiReceptionistEnabled` / `academyEnabled` tại stack | Medium–High | gate_with_flag / disabled_screen — policy sản phẩm |
| **LiveInterpreter** | `App.tsx` | Home, EmergencySOS, VietnamHub | ai | Không cờ navigation | Medium | needs_manual_review |
| **EmergencySOS** | `App.tsx` | SmartCalendar link, TravelSosHub | safety core | Ungated | Low cho safety — **không** đề xuất ẩn SOS thật | keep |
| **SmartCalendar** | `App.tsx` | B2B stack | ai / B2B | `GatedSmartCalendarScreen` → `aiReceptionistEnabled` | Low | keep |
| **KOLPartnerDashboard** | `App.tsx` | `DashboardScreen` commercial; deep link | admin demo / KOL | `kolDemoEnabled` trong gate | Low | keep |
| **AdminDashboard** (+ Profit, CRM, …) | `App.tsx` | Home secret tap + PIN; conditional stack | admin demo | `isAdminDebugSurfaceEnabled() && adminDemoMetricsEnabled` | Medium — Home vẫn gọi navigate khi debug | admin_only + verify stack registration |
| **Wallet** | `App.tsx` | Personal hub, nhiều màn | wallet/token | **Không** `vigTokenEconomyEnabled` | High (perception) | gate_with_flag — align P0-4 |
| **LoyaltyRewards** | `App.tsx` | Home, Dashboard B2C | wallet/token | Không cờ | High (mock copy trong audit trước) | gate_with_flag |
| **CashOut / DailyReward / ReferralReward** | `App.tsx` | Utility flows | wallet / gamification | Không cờ nav | Medium | needs_manual_review |
| **B2B: InboundQueue, InternalTradeMarket, AdBidding, …** | `App.tsx` | Merchant navigation | merchant / B2B advanced | Chỉ `B2BWorkspaceGate` + merchant tab MVP | Medium | needs_manual_review — optional `payroll`/feature later |
| **LocalUniverse** | `App.tsx` | `DashboardB2CScreen` — alias `LocalScreen` | local/booking | Không cờ (Local MVP) | Low | keep |
| **Legal scan** | `LocalScreen.tsx` + API | Nút AI Legal Scanner | local/booking | `legalScanEnabled` (P0-1) | Low (đã kill switch) | keep |
| **Omni** | `AdminDashboardScreen.tsx` (không phải route riêng) | Trong admin dashboard | admin demo | Chỉ khi admin stack mount; **`omniDemoEnabled` không đọc trong `App.tsx`** | Medium | needs_manual_review — tách cờ §9 |

*“Chưa xác định”:* hành vi chính xác của React Navigation khi deep link tới child tab đã unmount.

---

## 4. Deep Link Audit

**Config:** `App.tsx` — `rootLinking.config.screens`.

- **Tabs:** Vẫn khai báo `TabTravel`, `TabAi`, `TabRadar`, … dù tab có thể không mount — hành vi khi mở URL `/travel` hoặc `/ai` **Chưa xác định** (có thể warning, fallback root, hoặc lỗi — cần test runtime).
- **Stack:** Đường như `TravelHub`, `VietnamHub`, `AdultLearningHome`, `KOLPartnerDashboard`, `AdminDashboard` vẫn trong config — phần lớn stack đã bọc gate **trừ** `VietnamHub` như trên.
- **Khuyến nghị (không sửa code trong task này):** Đồng bộ linking với tab thực tế; redirect stack tới `MvpSurfaceDisabledScreen` khi cờ tắt; sửa **VietnamHub** dùng component gated.

---

## 5. Booking Flag Audit

| Hạng mục | Kết quả |
|----------|---------|
| **`bookingEnabled` dùng ở đâu?** | Chỉ định nghĩa trong `featureFlags.ts` + `miniAppRegistry` (`booking` mini-app). **Grep không thấy** consumer trong `MainTabNavigator`, `App.tsx`, hay navigation khác. |
| **Booking flow thật nằm đâu?** | Chủ yếu trong luồng **Home / Local / Merchant / tourism** (screens và service), không có tab “Booking” riêng trong `MAIN_TAB`. |
| **Nên gate ở đâu nếu false?** | **Chưa xác định** một điểm duy nhất — có thể guard trong action tạo booking (service) + CTA “Đặt” trên Local/Home khi có cờ. |
| **Cần trong MVP không?** | MVP narrative = booking included — **`bookingEnabled` mặc định true**. Có thể coi cờ là **future kill-switch** thay vì gate MVP mặc định. |

---

## 6. SOS / Lifeline Audit

| Thành phần | Phân loại | Ghi chú |
|------------|-----------|---------|
| **SOSFloatingButton + SOSModal** (`MainTabNavigator`) | Safety core — Global Lifeline | Giữ; ẩn icon chỉ khi B2C đang focus `TabAi` (voice shell) — Academy tab nếu không mount thì SOS hiện theo logic hiện tại. |
| **EmergencySOS** (stack) | Safety / emergency UI | **Không gate travel** — giữ cho kịch bản khẩn. |
| **TravelSosHub** | Travel surface | Đã `travelGated` trong App. |
| **Travel** SOS copy trong `TravelSosHub` vs **EmergencySOS** | Tách biệt route | Không đề xuất ẩn **EmergencySOS** như travel demo. |

---

## 7. AI Surface Audit

| Surface | Khi `aiReceptionistEnabled` false | Khi `academyEnabled` false |
|---------|-----------------------------------|------------------------------|
| **SmartCalendar** | `MvpSurfaceDisabledScreen` trong `GatedSmartCalendarScreen` | N/A |
| **LeonaCall** | Vẫn **đăng ký full screen** — truy cập từ Home, Local, Radar, SOS,… | N/A |
| **LiveInterpreter** | Ungated stack | N/A |
| **TabAi / LeTan** | N/A | Tab không mount; redirect `LeTan` pending một phần xử lý trong `MainTabNavigator` (fallback Home) |
| **Home proactive → TabAi** | N/A | Vẫn có thể `navigate('Tabs', { screen: 'TabAi' })` khi academy tắt — **residual risk** |

**Kết luận:** Gate receptionist **không** đóng hết AI voice/chat; cần policy riêng cho **LeonaCall** / **LiveInterpreter** nếu MVP không ship AI.

---

## 8. Wallet / VIG / Loyalty Surface Audit

| Route | Gate navigation | Ghi chú |
|-------|-------------------|---------|
| **Wallet** (`WalletScreen` = `WalletTopUpScreen`) | Không | Top-up / token perception — audit trước: nhánh Stripe/PAYG |
| **LoyaltyRewards** | Không | Copy mock risk trong audit trước |
| **CashOut / DailyReward / ReferralReward** | Không | Giữ cho MVP wallet ops hoặc gate theo `vigTokenEconomyEnabled` — **needs_manual_review** |
| **DashboardB2CScreen** | Navigate tới Loyalty, TravelHub, AdultLearningHome | Stack screens Travel/Academy đã gated; Loyalty **không** |

---

## 9. Admin / KOL / Omni Audit

| Surface | Gate hiện tại |
|---------|----------------|
| **Admin stack** (Dashboard, Profit, CRM, War Room, …) | Chỉ mount khi `isAdminDebugSurfaceEnabled() && getFeatureFlags().adminDemoMetricsEnabled` |
| **Home → AdminDashboard** | Chỉ khi debug + PIN (secret tap) — không phụ thuộc `adminDemoMetricsEnabled` tại điểm navigate; nếu stack không register, navigate có thể fail — **Chưa xác định** UX |
| **KOLPartnerDashboard** | `kolDemoEnabled` trong `GatedKOLPartnerDashboardScreen` |
| **Omni** | Nằm trong **AdminDashboardScreen** — không route riêng; **`omniDemoEnabled` không được kiểm tra trong `App.tsx`** — bật admin demo là có Omni UI trong màn đó |

**Tách `omniDemoEnabled`:** Hiện **chưa** tách khỏi `adminDemoMetricsEnabled` ở shell navigation — nếu cần tắt Omni mà giữ số liệu admin khác → **needs_manual_review** + thay đổi điều kiện trong `AdminDashboardScreen` hoặc cờ con.

---

## 10. Proposed P0 / P1 Code Changes

| Priority | Change | Files likely involved | Flag | Acceptance Criteria |
|----------|--------|----------------------|------|---------------------|
| **P0** | Sửa `VietnamHub` `Stack.Screen` dùng `VietnamHubScreenGated` (đã có sẵn) | `App.tsx` | `travelEnabled` | Khi travel tắt, mở VietnamHub chỉ thấy disabled screen |
| **P0** | Rà soát deep link + tab config khi child tab không mount | `App.tsx` linking, `MainTabNavigator` | — | Không crash; URL an toàn hoặc redirect |
| **P0** | Gate UI Home/Local/Dashboard B2C: ẩn hoặc disable CTA tới travel/academy khi cờ tắt (tránh navigate thừa) | `HomeScreen.tsx`, `DashboardB2CScreen.tsx`, `LocalScreen.tsx` | `travelEnabled`, `academyEnabled` | User không thấy nút “sống” tới surface tắt |
| **P1** | Gate `LeonaCall` / `LiveInterpreter` theo policy AI MVP | `App.tsx` hoặc wrapper screen | `academyEnabled` hoặc cờ AI mới | Product xác nhận không phá SOS/interpreter nếu vẫn MVP |
| **P1** | `Wallet` / `LoyaltyRewards` theo `vigTokenEconomyEnabled` hoặc P0-4 copy-only | `App.tsx`, screens | `vigTokenEconomyEnabled` | Không hiển thị “tiền thật” khi economy tắt |
| **P1** | `RadarDiscovery` — cờ hoặc đặt sau pilot | `App.tsx`, hoặc screen | **Chưa xác định** | Giảm Leona/merchant leak |
| **P2** | Wire `bookingEnabled` vào CTA booking hoặc xác nhận luôn true MVP | Services + hub screens | `bookingEnabled` | Đồng bộ với registry |
| **P2** | `omniDemoEnabled` riêng trong Admin dashboard | `AdminDashboardScreen.tsx` | `omniDemoEnabled` | Tắt Omni mock không tắt cả admin debug |

---

## 11. Final Recommendation

| Câu hỏi | Trả lời |
|---------|---------|
| **Sang P0-4 Wallet/VIG copy được chưa?** | **Được**, nhưng nên **vá P0 residual navigation trước** — ít nhất **`VietnamHub` gated mismatch** (dòng Stack vs biến `*Gated`) để không còn lộ travel stack khi cờ tắt. |
| **Cần P0-3C navigation residual gate không?** | **Có** — coi **fix VietnamHub + deep link/tab orphan + CTA Home/Local** là **P0-3C** trước khi coi navigation “đóng” MVP. |
| **Task code tiếp theo?** | 1) **P0-3C:** `App.tsx` VietnamHub + linking sanity + optional CTA flags. 2) **P0-4:** Wallet/VIG/Loyalty copy + optional `vigTokenEconomyEnabled` trên route wallet. |

---

## Phụ lục — Top 10 residual route rủi ro (ước lượng)

1. **VietnamHub** — thiếu dùng gated component.  
2. **Wallet** — không cờ economy; top-up perception.  
3. **LoyaltyRewards** — mock/copy risk.  
4. **RadarDiscovery** — gateway AI + merchant.  
5. **LeonaCall** — AI voice không khớp `aiReceptionistEnabled`.  
6. **LifeOSDashboard** — scope Life OS chưa gate.  
7. **Home → TravelCompanion / proactive flows** — CTA khi travel/academy tắt.  
8. **DashboardB2CScreen** — shortcuts tới Travel/Academy/Loyalty.  
9. **Deep link** tới `travel` / `ai` khi tab không mount.  
10. **B2B InternalTradeMarket / AdBidding** — advanced B2B không có cờ P0-3.

---

## Phụ lục — P0 changes đề xuất (tóm tắt)

- Sửa **`VietnamHub`** → `VietnamHubScreenGated`.  
- Kiểm thử / harden **linking** khi tab con thiếu.  
- (Tuỳ sản phẩm) Ẩn hoặc gate **LeonaCall** / **RadarDiscovery** cho MVP.

---

## Phụ lục — Recommendation: P0-3C vs P0-4

- **Làm P0-3C trước** (residual gate + VietnamHub).  
- **Sau đó P0-4** (wallet/token copy và có thể gate `Wallet`/`Loyalty`).

---

*Tài liệu chỉ audit; không chỉnh sửa mã nguồn trong task này.*
