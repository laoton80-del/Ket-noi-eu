# VIONA Global Brand & Localization Audit

**Scope:** Full-app scan for legacy **ViGlobal / KNG / Kết Nối Global / VIG** exposure, **English inside Vietnamese UX**, **CZ/DE/Prague/Berlin** hardcoding, **logo/icon/splash** wiring vs VIONA super-app positioning.  
**Method:** Static analysis (`app.config.js`, `app.json`, `src/**` including listed screens, `src/i18n/**`, repo-wide `rg`). **No runtime browser** in this pass.  
**Rules honored:** No code changes; no migrations; no payment/auth/booking/wallet logic edits in this task.  
**Date:** 2026-05-05  

---

## 1. Executive Summary

| Question | Answer |
|----------|--------|
| **App còn giống ViGlobal ở đâu?** | **Store/listing identity:** `app.config.js` / `app.json` **name** = `Kết Nối Global`, **slug/scheme/bundle** = `ket-noi-global` / `ketnoiglobal`. **Config spine:** `src/config/appBrand.ts` still defines **ViGlobal**, **KNG**, **Kết Nối Global** as primary strings. **i18n `vi.json`:** multiple user-visible strings still say **ViGlobal** / **ViGlobal Command Center** / **VIG** in B2B + trust areas. **Runtime UI:** `HomeScreen` hero eyebrow uses `brandNameForSurface('b2c')` → **ViGlobal** next to **VIONA** copy. **Boot / network:** `TrustPreflightGate`, `MeshRadar` Vietnamese legacy lines. |
| **Bao nhiêu surface public cần đổi sang VIONA?** | **Order of magnitude ~15–25 high-impact surfaces** (Expo name + splash/icon path + hero + boot gate + `vi.json` home/b2b/trust blocks + EN `b2b.rankingBanner` + B2B paywall + merchant VietQR labels + loyalty header/icon semantics + a few marketing/admin demos if ever shown to non-internal users). **Broader codebase:** `rg` shows **100+ files** under `src/` touching legacy tokens (many **internal** services/comments). |
| **Bao nhiêu tiếng Anh trong bản tiếng Việt?** | **Two layers:** (1) **`vi.json` still contains English product names** (“ViGlobal”, “Command Center”, “VIG”, “Power SaaS”, “EN/KR/JP”, “AI Shield”, etc.). (2) **Many screens bypass i18n** with hardcoded **English** strings (AI Receptionist demo/pilot, parts of Home briefing cards, tier names on `LoyaltyRewardsScreen`, etc.) — when device language is Vietnamese, those remain English. **Exact count** would require a scripted AST pass; qualitatively **dozens** of mixed-language strings. |
| **Có hard-code Séc/Đức không?** | **Yes, by design in parts of the product spine:** `countryPacks` / `DEFAULT_COUNTRY_PACK` / `SetupProfileScreen` CZ & DE rows; **`src/state/region.ts`** defaults `currentCountry: 'Czechia'`, `localLanguage: 'Czech'`; **mock content** (Local classifieds Berlin, Home briefing “Prague”, merchant radar “Berlin · EUR wallet”); **SOS / embassy** catalog (`EmergencySosService`) Berlin/Praha/Frankfurt/München; **admin/marketing** demos (Facebook WarRoom, SalesLeadCRM). |
| **App đã đủ cảm giác global chưa?** | **Partial.** `brandConfig` + VIONA-named hubs (Dashboard/Local) help, but **OS-visible app name**, **legacy i18n**, **EU corridor mock data**, and **dual brand configs** prevent a coherent “global super app” read. |

---

## 2. Brand Remnants

**Legend:** Public must change · Internal can stay · Needs review  

| File / Screen | Current text / asset | Public / Internal | Risk | Recommendation |
|---------------|----------------------|-------------------|------|----------------|
| `app.config.js` | `expo.name: 'Kết Nối Global'`; `slug` / `scheme` legacy; Face ID string mentions **“Ví Global”** | **Public** | **High** — OS + permission dialogs | Rebrand to **VIONA** + wallet wording **VIO / VIONA Wallet**; plan slug/bundle change separately (store risk). |
| `app.json` | Same display name + `./assets/icon.png`, `./assets/splash.png`, web `favicon` | **Public** | **High** | Replace **assets** when VIONA pack ready; align `name`. |
| `src/config/appBrand.ts` | `publicName: 'ViGlobal'`, `internalName: 'KNG'`, `masterName: 'Kết Nối Global'` | **Mixed** | **High** for any `brandNameForSurface('b2c')` | Keep internal/legal mapping **only** where required; route **all B2C UI** through `brandConfig`. |
| `src/core/brand/brandConfig.ts` | VIONA + `legacyNames` list | **Public** (good) | Low | Use as **single public** source; expand docs for engineers. |
| `HomeScreen.tsx` | Eyebrow `brandNameForSurface('b2c')` → ViGlobal; body VIONA | **Public** | **High** | Switch eyebrow to `brandConfig.displayName`. |
| `TrustPreflightGate.tsx` | Boot copy **Kết Nối Global** | **Public** | **High** | VIONA-first line + optional legal subtitle. |
| `MeshRadar.tsx` | “…người dùng **Kết Nối Global**…” | **Public** (if shown) | Med | Replace with **VIONA**. |
| `src/i18n/locales/vi.json` | `welcome_message` / `home.welcome` → **ViGlobal**; `b2b.rankingBanner` ViGlobal + **nạp VIG**; `trustShield*` ViGlobal | **Public** | **High** | P0 string pass to **VIONA** + **VIO Points/Credits** per `vioDisplayConfig`. |
| `src/i18n/locales/en.json` | `b2b.rankingBanner` ViGlobal + **VIG Tokens** | **Public** | **High** | Same as VI + VIO naming policy. |
| `B2BPaywallScreen.tsx` | ViGlobal + VIG token copy | **Public** (B2B path) | **High** | Align to VIONA + VIO + non-crypto tone. |
| `MerchantDashboardScreen.tsx` | Mock `TODAY_REVENUE_VIG`, `formatVigTokenNumber`, radar guest **Berlin · EUR wallet** | **Public** (demo) | Med | Credits label + less EU-only demo locale variety. |
| `WalletTopUpScreen.tsx` | Mostly **VIO Credits** (good) | **Public** | Low | Spot-check remaining legacy in alerts only. |
| `LoyaltyRewardsScreen.tsx` | Uses `brandConfig` + `formatVioPoints` but **tier labels EN** (`DIAMOND`…), `VigTokenIcon` | **Public** | Med | Localize tier names; rename icon for VIO semantics. |
| `AiReceptionist*Screen.tsx` | Headers/disclaimers largely **English** | **Public** (merchant) | Med for global | Add `vi`/`en` parity via i18n or split copy files. |
| `src/services/**`, `src/controllers/**` | Many **ViGlobal / VIG** in comments & server facades | **Internal** | Low for customers | Mark “do not surface in UI”; optional rename later. |
| `src/navigation/routes.ts` | Comments / displayName strings (grep hits) | **Mixed** | Low | Review only if surfaced in deep links or errors. |

---

## 3. Logo / Icon / Splash Audit

| Asset / config | Current | Expected VIONA | Priority |
|----------------|---------|------------------|----------|
| **App icon** | `./assets/icon.png` (`app.config.js`, `app.json`, iOS, Android adaptive) | VIONA mark (master **SVG → PNG** @1024 + adaptive safe zone) | **P0** |
| **Splash** | `./assets/splash.png`, bg `#050B14` | VIONA splash (wordmark + subtle gradient), same bg or brand token | **P0** |
| **Web favicon** | `./assets/favicon.png` | VIONA favicon | **P1** |
| **Notifications icon** | `expo-notifications` `icon: ./assets/images/icon.png` | Align with app icon set | **P1** |
| **In-app Home logo** | `HomeScreen` `IMG_LOGO` → `assets/home/logo.png` | VIONA horizontal/round mark consistent with store | **P0** |
| **Expo `expo.name`** | **Kết Nối Global** | **VIONA** (or “VIONA — …” if legal subtitle required) | **P0** |

*Visual audit of pixel contents not performed in this task — file paths only.*

---

## 4. Vietnamese Localization Issues

**Note:** “English in Vietnamese build” = either **`vi.json` still has English/legacy brand**, or **TSX hardcodes English** while `i18n` language is `vi`.

| File / area | English or legacy text (sample) | Vietnamese replacement (suggested) | Priority |
|-------------|----------------------------------|-------------------------------------|----------|
| `vi.json` `welcome_message` | “Chào mừng đến **ViGlobal**” | “Chào mừng đến **VIONA**” | **P0** |
| `vi.json` `home` / trust strings | “**ViGlobal** Command Center”, “**ViGlobal** Trust & AI Shield” | “**VIONA** …” / “Trung tâm an toàn VIONA” (tone legal review) | **P0** |
| `vi.json` `b2b.rankingBanner` | “nhờ **ViGlobal**”, “nạp **VIG**” | “nhờ **VIONA**”, “nạp **VIO Credits** / **VIO Points**” | **P0** |
| `vi.json` `b2b.vietqr.vigLabel` | “**(VIG ≈ EUR)**” | “**(đơn vị ví nội bộ, không phải tiền mặt)**” + VIO label | **P0** |
| `HomeScreen.tsx` briefing cards | e.g. “**Gold lounge access Prague**” (EN) | Move to `vi.json` / `en.json` keys; VI: “Quyền lợi phòng chờ vàng (demo địa điểm)” | **P1** |
| `DashboardB2CScreen.tsx` | Mixed VI/EN pills (“**Translation**”, “**AI Learning**”) | Full VI strings or i18n-driven | **P1** |
| `AiReceptionistDemoSimulatorScreen.tsx` | “**SIMULATED DEMO**”, safety card EN | Duplicate block in `vi.json` or bilingual section | **P1** |
| `AiReceptionistPilotRequestScreen.tsx` | Form labels EN; placeholder “**Vietnamese, English, Czech...**” | Localized labels; placeholder “Tiếng Việt, Anh, Séc…” | **P1** |
| `AiReceptionistSetupChecklistScreen.tsx` | Checklist EN | `vi` professional translation | **P1** |
| `LoyaltyRewardsScreen.tsx` | Tier **DIAMOND / GOLD / SILVER / MEMBER** | “Kim cương / Vàng / Bạc / Thành viên” | **P1** |
| `WalletTopUpScreen.tsx` | Mix VI + some product English in longer paragraphs | Pass through copywriter for pure VI | **P2** |

---

## 5. Country / Market Hardcoding

| File / screen | Hardcoded market | Why risky | Recommendation |
|---------------|------------------|-----------|------------------|
| `src/state/region.ts` | Default **Czechia** + **Czech** language | Global users may think app is **CZ-only** | Derive from `Localization.locale` + profile; neutral “unset” state. |
| `SetupProfileScreen.tsx` | Country list shows **Czechia (T1)**, **Germany (T2)** | OK as **tiers**, but UI reads **EU launch** not **worldwide** | Add copy: “Bậc giá theo thị trường — không giới hạn quốc gia”. |
| `countryPacks/packs.ts` | Explicit **Czech Republic** pack + comments | Correct for pricing engine; risky if **only** CZ stories in marketing | Keep data; soften **consumer-facing** mock defaults. |
| `HomeScreen.tsx` | Briefing **Prague** | EU story leak on **global** brand | Replace with rotating city or “your city” from context. |
| `LocalScreen.tsx` | Mock posts **Berlin**, **Praha**, **Vienna** | Demo realism OK; **over-index EU** in screenshots | Add non-EU mock rows (US/AU/SG) for balance. |
| `MerchantDashboardScreen.tsx` | Radar guest **Berlin · EUR wallet** | Same | Vary currency/locale tokens. |
| `EmergencySosService.ts` | Embassy rows **Berlin, Praha, Frankfurt, München** | Legitimate **Vietnamese embassy** dataset; still **DE/CZ heavy** | Ship as “EU chapter”; add **region selector** for other continents in later release. |
| `FacebookWarRoomScreen.tsx` | **Berlin** salons, **Hội Người Việt Séc** | Admin toy; **do not demo** as global | Mark internal-only or anonymize cities. |
| `AiReceptionistDemoSimulatorScreen.tsx` | Scenario language **Czech** | Fine as **one** demo language | Pair with EN/VI scenarios already partially present. |
| `DemoSandbox.ts` | **Germany — Vietnamese community** | Marketing segment hardcode | Move to `MarketConfig` narrative file. |

---

## 6. Global Market Model Recommendation

Proposed **non-breaking** architecture (future implementation — not done in this audit):

1. **`MarketConfig` registry** — ISO-3166 keyed rows: `{ id, displayName, currencyHints, pilotStatus, sosChapterId, pricingTierId, copyVariant }`.  
2. **`currentMarket` resolver** — priority: **user residence** (profile) → **GPS / locale** (permission-gated) → **destination** (travel flow) → **global neutral** row.  
3. **Separate concerns:** **pricing** (existing `countryPacks`) vs **marketing copy** vs **SOS dataset chapter**.  
4. **`pilotStatus` per market** — `active | beta | lite | frozen | hidden` for mini-apps (`miniAppRegistry` already has statuses — align naming).  
5. **Content feeds** — mock classifieds / war-room samples pull from `MarketConfig.demoContentId`, not inline Berlin strings.

---

## 7. P0 Fix Pack (small tasks)

| Pack | Tasks |
|------|--------|
| **A. Brand asset wiring** | New VIONA **icon / splash / favicon / home logo**; update `app.config.js` + `app.json` paths; notification icon parity. |
| **B. Public copy cleanup** | `appBrand` vs `brandConfig` governance; `HomeScreen` eyebrow; `TrustPreflightGate`; `MeshRadar`; `B2BPaywallScreen`. |
| **C. Vietnamese i18n cleanup** | `vi.json` ViGlobal/VIG/ViGlobal Command Center strings; `en.json` merchant ranking; `de.json`/`cs.json` parity for same keys if present. |
| **D. Country registry foundation** | `region.ts` defaults; mock data variety; optional `MarketConfig` stub **read-only** for UI (no pricing math move). |
| **E. Home / Local / Merchant shell** | Briefing cards i18n; merchant radar mock locale mix; VietQR label VIG→VIO policy wording. |

---

## 8. Do Not Touch (in this initiative)

- **Prisma** schema, enums, DB field names  
- **Wallet math**, ledger rules, settlement, FX locks  
- **Payment** providers, Stripe webhooks, IAP routing logic  
- **Booking** state machines, escrow completion rules  
- **Auth** JWT sign/verify, session issuance, middleware ordering  
- **Backend** service facades (`WalletService`, `BookingService`, …) **except** user-visible error message mapping (separate copy-only task if ever needed)  
- **Feature flag semantics** (`featureFlags.ts` boolean meanings) — copy around flags may change, not gate logic  
- **Internal-only** filenames such as `viGlobalWalletApi.ts` until a dedicated rename epic  

---

## 9. Smallest Next Code Task (≤ 5 files)

**Objective:** Maximum brand clarity with minimum blast radius.

1. `src/screens/HomeScreen.tsx` — hero eyebrow → `brandConfig.displayName`.  
2. `src/i18n/locales/vi.json` — replace ViGlobal/VIG in **welcome + home + b2b.rankingBanner + trust** blocks.  
3. `src/i18n/locales/en.json` — `b2b.rankingBanner` ViGlobal/VIG → VIONA/VIO.  
4. `src/components/TrustPreflightGate.tsx` — boot line VIONA-first.  
5. `app.config.js` (and optionally `app.json`) — `expo.name` + Face ID permission string to VIONA / VIONA Wallet wording **only** (no bundle id change in this micro task unless planned).

---

## 10. Final Recommendation

**B — Need Brand + i18n P0 before a credible “VIONA global super app” demo.**  
Optional follow-up: **C** (country defaults + mock diversity) in the **same sprint** if the narrative is “global diaspora”, not “EU pilot only”.

---

## Appendix — Commands

| Command | Result |
|---------|--------|
| `git status --short` | `?? docs/audit/VIONA_GLOBAL_BRAND_LOCALIZATION_AUDIT.md`, `?? docs/audit/VIONA_WEB_UI_PRODUCT_AUDIT.md`, `?? metro-web-bundle.js` (untracked local artifacts). |
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** (0 errors; existing warnings unchanged) |

*Appendix refreshed on re-run; audit body unchanged from prior static review.*

---

## Printed outputs (per instructions)

### P0 issues (concise)

1. **Expo public name + permissions** still **Kết Nối Global / Ví Global** (`app.config.js` / `app.json`).  
2. **`appBrand` vs `brandConfig`** → split-brand on **Home** eyebrow.  
3. **`vi.json` + `en.json`** merchant/trust/welcome still **ViGlobal / VIG**.  
4. **Trust boot + MeshRadar** legacy **Kết Nối Global** strings.  
5. **B2B Paywall** ViGlobal / VIG if surfaced.  
6. **Logo/icon/splash** paths point to **legacy asset files** until art replaces them.

### Hardcoded CZ / DE issues (concise)

- **`region.ts`** default Czechia/Czech.  
- **`SetupProfileScreen`** explicit Czechia/Germany tier rows.  
- **Mock UI:** Home **Prague**, Local **Berlin/Praha/Vienna**, Merchant **Berlin · EUR**.  
- **SOS dataset:** multiple **DE/CZ** embassy entries (factually OK; narrative should frame as regional chapter).  
- **Admin/marketing demos:** Berlin-focused samples.

### Smallest next code task

**Home eyebrow + `vi.json`/`en.json` merchant+trust+welcome + TrustPreflightGate + `expo.name`/permission strings** (≤ 5 files) — **no** Prisma/API/math changes.

### Recommendation letter

**B**
