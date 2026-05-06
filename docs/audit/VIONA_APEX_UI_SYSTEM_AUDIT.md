# VIONA Apex UI System Audit

**Role:** Principal App Design Engineer + Design Systems Architect + UX Information Architect  
**Date:** 2026-05-06  
**Method:** Read-only review of listed docs + representative screens/components. **No code changes** in this task.

**Sources read:** `VIONA_GLOBAL_COMPANION_OS_ARCHITECTURE.md`, `VIONA_FINAL_MASTER_BLUEPRINT_V2.md` (Hub rules, universes, Smart Trio), `docs/audit/*` (prior brand/navigation audits referenced at high level), `src/components/viona/*`, `MainTabNavigator.tsx`, `HomeScreen.tsx`, `LocalScreen.tsx`, `TravelScreen.tsx`, `AcademyScreen.tsx`, `LoginScreen.tsx`, `B2BPaywallScreen.tsx` (header), `ProfileSwitcher.tsx`, `SOSFloatingButton.tsx`, `en.json`/`vi.json` (tab labels via grep).

---

## 1. Executive Summary

| Question | Answer |
|----------|--------|
| **Có cần full redesign không?** | **Không.** Đã có hướng **Clean Tech Trust** (canvas sáng, ink, gold vừa phải) và token hybrid trong `vionaTrustTokens.ts`; `HomeScreen` đã dùng `VionaCard` / `VionaSectionHeader` / `vionaTrust`. Full redesign sẽ **phá continuity** và không cần thiết nếu hệ thống hóa theo blueprint. |
| **Có nên giữ Clean Tech Trust không?** | **Có — đây là Core đúng với Master Blueprint** (Hub “sạch, trust-first, không overloaded” là *đích*; hiện Home đang tiến đúng *tông* nhưng còn **quá nhiều block** so rule “above-the-fold chỉ action sinh tử / giá trị cao”). |
| **UI thiếu gì để “hiện đại bậc nhất”?** | Thiếu **hệ thống hoàn chỉnh**: một lớp **layout + hierarchy** thống nhất (spacing typographic scale), **status surface** cho mọi mini-app (Lite / Pilot / Demo / Gated), **một luồng CTA** (resolver + gate UI — phần IA đã audit ở `VIONA_GLOBAL_COMMERCIALIZATION_READINESS_AUDIT.md`), và **đồng bộ 3 vỏ** (Trust / Navy Premium / Dark Ops) thay vì màn hình lẻ (ví dụ Academy) vẫn mang aesthetic cũ. |
| **Lỗi lớn nhất: visual hay structure?** | **Structure (IA + hierarchy) > visual polish.** Visual đã có token tốt; vấn đề chính là **một màn quá nhiều ý định** (Home, Local), **trùng lặp đường vào** (Leona / ví / travel), và **thiếu nhãn trạng thái** thống nhất trên card mini-app — dễ vi phạm “one screen = one main action” và “CTA không gây hiểu nhầm production”. |

---

## 2. Design Direction Decision

Chốt cho **VIONA Apex UI System** (bám blueprint, không trend-chasing):

| Layer | Direction | Ghi chú ngắn |
|-------|-----------|--------------|
| **Core app (Hub, Login, Local shell B2C)** | **Clean Tech Trust** | Canvas `#F6F8FB` class, surface trắng, ink `#0F172A`, signal blue, **gold accent chỉ nhấn** (đã thể hiện trong `vionaTrust` / `HomeScreen`). |
| **Travel / VIP moments** | **Navy Premium Minimal** | Dùng `vionaPremium.headerInk`, viền card navy nhạt, **không** biến toàn bộ app thành dark luxury; chauffeur / platinum = **accent panels** trên nền trust. |
| **Merchant / Ops / Broker / Admin** | **Dark Ops Dashboard** | `vionaOps` tokens; tab B2B/Broker/Admin trong `MainTabNavigator` — **Needs confirmation** độ đồng nhất từng sub-screen (Orders, Catalog) với ops shell. |

**Nguyên tắc blueprint nhúng vào DS:** SOS 3s; không fake emergency; CTA non-production phải có **Demo / Pilot / Lite**; Smart Trio i18n là **Core OS** — language control không chỉ là “chip VN/EN” trên Login.

---

## 3. Screen-by-Screen Assessment

| Screen | Current UI Quality | Main UX Problem | Visual Problem | Priority | Recommendation |
|--------|-------------------|-----------------|----------------|----------|----------------|
| **Login** | Tốt — trust blue CTA, `WelcomeBrandPanel`, lang bar | Chỉ **vi/en**; chưa phản ánh **Smart Trio** (native market) | Ink tím riêng (`LOGIN_INK`) hơi lệch hoàn toàn so `vionaTrust` nhưng vẫn “premium trust” | P1 | Gắn Login vào **VionaScreen variant trust**; mở rộng language sheet (không chỉ 2 chip) theo blueprint |
| **Home** | Tốt về token + card mới | **Quá tải**: tourist vs expat layout, charity, briefing rail, action center, `DashboardB2C`, utilities, proactive, persona modal — **nhiều primary** | Gold + chips nhiều; một số **copy hardcoded VN** (“Tổng đài viên…”, “Đồng hành”, “Mắt Thần”) lệch i18n | **P0** | **Tier layout**: above-the-fold = SOS + 1 briefing + launcher; đẩy phần còn lại vào “More” hoặc tab; mọi CTA qua **status badge** |
| **Local** | Trung bình–khá (trust canvas) | **Nhiều mô hình tâm trí**: classified demo + VIP + legal scan + booking/demo payload — **không một main action** | Modal composer + animation; hợp lý nhưng dense | **P0** | Tách **tab hoặc segment**: “Marketplace” / “Community board (Demo)” / “Tools”; nhãn **Demo** trên classified |
| **Travel** | Khá — đã import `vionaPremium` + trust canvas | Bento grid nhiều offer; **Ultra chauffeur** vs alert-only tiles — hierarchy | `mockExchangeLineVi` + data `kngTravelHospitality` — **tên legacy trong code** ảnh hưởng cảm nhận (dù UI có thể đẹp) | **P0** | **Direction picker** (3 hướng) trước bento; mọi tile premium: badge **Pilot / Info only** |
| **Academy** | Yếu về **hệ thống** | Một CTA rõ (`LiveAiTeacher`) — **tốt**, nhưng **không** “Lite” badge trong UI đọc được | Toàn màn **DeepInkNavy + SignatureGold** — lệch **Clean Tech Trust** của Hub; giống “luxury app cũ” hơn Academy Lite | **P0** | Áp `vionaTrust` + một dải `vionaPremium` nhỏ; thêm `VionaStatusBadge`: **Academy Lite** |
| **Merchant Dashboard** | **Needs confirmation** (chỉ đọc tab wrapper) | Tab B2B có gate + paywall — OK structurally | Có thể mix light/dark giữa paywall và dashboard | P1 | Chuẩn hóa **Dark Ops** cho toàn workspace; paywall = trust light **có disclaimer sandbox** (đã có comment code) |
| **AI Receptionist** | Demo path: badge **SIMULATED** (đã biết từ audit trước) | Setup → Demo → Pilot funnel — **tốt**; cần cùng **component họ** với Hub | English-heavy pilot form — OK nếu có i18n | P1 | Dùng chung **VionaGateSheet** cho “Pilot locked / Demo on” |
| **B2BPaywall** | Giàu thông tin, gradient + gold | Tier + trap copy phức tạp — **cognitive load**; merchant cần **1 recommended action** | `MOCK_BOOKINGS_EUR` — kể cả có ý định dev, **rủi ro niềm tin** nếu hiển thị như thật | **P0** | Primary = **một nút**; volume demo = **nhãn Demo** hoặc ẩn; Stripe chỉ sandbox copy |
| **Profile** | `ProfileSwitcher`: blur modal, role meta | Role hints EN cố định (“God-Eye…”) — tone không “trust enterprise” | FAB + modal stack với SOS — **Needs confirmation** overlap z-index | P1 | i18n role hints; tone **ops professional**; test web/desktop `pointerEvents` |
| **SOS** | `SOSFloatingButton` → `SOSShieldComponent`, hold pattern documented | **Tốt**: hold-to-trigger, buffer constant tách file triage | Glow web reduce motion — good | P1 | **Một** consumer-facing SOS pattern; `VionaSOSButton` spec wrapper (implementation sau) |
| **Wallet / VIO** | Entry từ Home chips | Nhiều entry (QR widget, utility ví) — **trùng** | Copy VIO vs legacy VIG — chủ yếu content, không chỉ UI | P1 | Một **Wallet hub** card + status “display only / live” |

---

## 4. Information Architecture Issues

| Issue | Evidence / symptom | Apex mitigation |
|-------|-------------------|-----------------|
| **Mini-app clarity** | `HomeScreen` kết hợp `DashboardB2CScreen`, utility chips, `openProtected` stack routes — user khó map “mini-app nào đang mở” | **VionaMiniAppCard** luôn có `id` + `status` + một CTA |
| **CTA clarity** | Nhiều `Pressable` cùng trọng số visual (gold icon 22) | **Primary / secondary / tertiary** levels trong DS; tối đa **1 primary** per viewport |
| **Status labels** | Registry có `status: lite | pilot | demo` nhưng **UI card chưa bắt buộc** badge | **VionaStatusBadge** map 1:1 với `miniAppRegistry` |
| **Route fallback** | `resolveMiniAppEntry` không silent fallback (tốt) nhưng **chưa** dùng ở shell — CTAs vẫn `navigate` trực tiếp | Gate sheet thay vì đưa về **Tổng quan** im lặng |
| **Overloaded screens** | `HomeScreen`, `LocalScreen` | **Fold contract** per blueprint + lazy sections |
| **Language confusion** | Login: vi/en; Home: hardcoded VN; Travel: `weatherLabelVi` / mock FX tiếng Việt | **VionaLanguageSwitcher** concept = app + market + customer (Smart Trio) |

---

## 5. VIONA Apex Component System

Đề xuất **hệ component** (tên Apex; có thể bọc/refactor từ `VionaCard` / `VionaSurface` hiện có — **không tạo file trong task audit này**):

| Component | Responsibility |
|-----------|----------------|
| **VionaScreen** | Safe area + background theo `variant`: `trust` \| `premium` \| `ops`; max width shell (đã có pattern `maxShell` trên Home). |
| **VionaHeader** | Title + optional subtitle + **right slot** (language, role chip); không nhồi >2 actions. |
| **VionaCard** | **Đã có** — mở rộng slot `footer` cho status row. |
| **VionaButton** | Primary (trust blue) / secondary (outline ink) / danger / ghost; `minHeight` 44, press opacity. |
| **VionaMiniAppCard** | Icon + name + **VionaStatusBadge** + một line value + **single** `onPrimaryPress`. |
| **VionaStatusBadge** | Map `active | lite | beta | pilot | demo | gated | frozen | comingSoon` — màu + icon nhất quán. |
| **VionaGateSheet** | Bottom sheet: lý do gate (auth, flag, role, demo) + CTA an toàn (login / request pilot / đóng). |
| **VionaLanguageSwitcher** | Smart Trio: không chỉ vi/en; optional compact mode trên header. |
| **VionaSOSButton** | Wrapper FAB: hold progress, a11y label, `reduceMotion`, vị trí offset tab bar — delegate `SOSShieldComponent`. |
| **VionaEmptyState** | Illustration nhẹ (không neon) + title + một primary + link phụ. |

---

## 6. Visual Tokens

| Token | Proposal (align `vionaTrustTokens.ts`) |
|-------|----------------------------------------|
| **Colors** | Giữ `vionaHybrid.navy` / `trustBlue` / `gold` như canonical; **không** thêm palette thứ 4. Ops = `vionaOps.*` only trong merchant/admin. |
| **Spacing** | Bội số **4**: 8 / 12 / 16 / 24 / 32; section gap **24**; card padding **16** (đã gần với `VionaCard`). |
| **Radius** | Card **14–16**; chip **999**; sheet top **20**. |
| **Typography** | `FontFamily` hiện có: **1 display** (logo/hero), **1 sans body**; scale cố định: 12 / 14 / 16 / 20 / 24; line-height ≥ 1.35 cho VN. |
| **Shadows** | Như `VionaCard` hiện tại (y=4, opacity 0.06) — **không** nâng lên glassmorphism nặng. |

---

## 7. Motion / Interaction Guidelines

| Guideline | Detail |
|-----------|--------|
| **Haptics** | Như `ProfileSwitcher`: light cho chọn lại cùng role, medium cho switch; **tắt trên web**. |
| **Press feedback** | Opacity 0.88–0.92 (đã dùng nhiều nơi) — chuẩn hóa một token `pressedOpacity`. |
| **Hold SOS** | Giữ **3s** (blueprint); progress ring rõ; cancel on release — đã document trong `SOSFloatingButton`. |
| **Animation** | Modal composer Local: timing 240ms OK — **giới hạn** parallel motion (một phần tử chính / screen). |
| **Route transition** | Stack push = slide; tab = instant; sau gate success nên có **micro-copy** “Đang mở …” **Needs confirmation** với React Navigation config. |

---

## 8. Accessibility

| Area | Assessment | Action |
|------|------------|--------|
| **Contrast** | Trust ink on white: generally OK; gold text on gold button (Academy CTA) — **Needs confirmation** ratio | Kiểm tra WCAG AA trên **gold CTA** và ops muted text |
| **Font scaling** | Login `adjustsFontSizeToFit` — tốt; **Needs confirmation** rest of Home | `allowFontScaling` default true; test `maxFontSizeMultiplier` |
| **Touch target 44+** | Chips nhỏ trên utility row — **có nguy cơ <44** | `minHeight` / `hitSlop` chuẩn |
| **Language readability** | VN dài trên briefing 2 lines — OK với `numberOfLines` | Tránh string chèn hardcode không qua i18n |
| **Chips không clip** | `numberOfLines={1}` trên lang — OK | Test German/French sau này |
| **Overlay** | Admin PIN overlay trên Home — OK dev-only; đảm bảo không trong production store | Feature gate |

---

## 9. P0 UI Fix Plan

| Pack | Scope | Outcome |
|------|--------|---------|
| **Pack A — Design tokens** | Document + `theme` bridge: `pressedOpacity`, section spacing, **single** gold usage rule | Mọi màn mới không invent màu |
| **Pack B — Core components** | Hoàn thiện spec `VionaScreen`, `VionaHeader`, `VionaButton`, `VionaStatusBadge`, `VionaGateSheet` (implementation phase sau) | Compose 80% UI từ DS |
| **Pack C — App shell + safe overlay** | Tab bar + FAB + ProfileSwitcher z-order; reduce double modals | Không che SOS / không block điều hướng |
| **Pack D — Mini-app cards + status** | `DashboardB2CScreen` + Hub launcher dùng `VionaMiniAppCard` + badge đồng bộ registry | User hiểu Lite/Pilot/Demo |
| **Pack E — Login / Home / Local / Travel / B2B polish** | Home fold + i18n hardcoded; Local segments; Travel direction + badge; Paywall mock volume | **One main action** per primary screen |

---

## 10. What Not To Do

- **Không** full dark app cho B2C — trái Clean Tech Trust.  
- **Không** heavy glass / neon / gradient lottery — nhìn “trend 2024” nhưng trái positioning **bảo hộ & tin cậy**.  
- **Không** luxury overload (gold everywhere) — blueprint: accent có kiểm soát.  
- **Không** ship UI kit tách hẳn màn hình thật (storybook-only) — DS phải **ăn khớp** `HomeScreen` / tabs ngay.  
- **Không** dùng UI đẹp để **che** hành vi payment/AI production — luôn **badge + gate copy**.

---

## 11. Final Recommendation

**B. Giữ hướng Clean Tech Trust + Navy Premium + Dark Ops đã định nghĩa trong token; triển khai design system (component + IA hierarchy) có kiểm soát — không full redesign.**

*(Nếu chọn một chữ: **B**.)*

**Không chọn D** vì token và một phần Hub đã đúng hướng. **Không chọn A** vì vấn đề là **hệ thống + hierarchy**, không chỉ “minor polish”. **C** (partial redesign) có thể áp dụng **sau** khi registry/gate IA xong — có thể gộp vào wave E nhưng **không bắt buộc** đập lại toàn bộ visual.

---

## Appendix — Blueprint quotes (Hub)

Master Blueprint V2: Hub phải **sạch, trust-first, không overloaded**; **above-the-fold chỉ action sinh tử hoặc giá trị cao**; không để CTA non-production trông như production. Đây là **chuẩn đo** cho Apex UI.

---

**End of audit.**
