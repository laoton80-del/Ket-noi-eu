# VIONA Wave 3 — Consumer UX Surface Audit

**Pack:** `VIONA.WAVE_3.CONSUMER_UX_SURFACE_AUDIT.1`
**Prep:** `docs/design/VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md`
**Master wave roadmap:** `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md`
**Audit baseline HEAD:** `e2b43ef` — `docs(design): prepare Wave 3 consumer UX excellence`
**Audit date (UTC):** 2026-05-24
**Tile rules:** `docs/design/VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` — **COMPLETE** (`VIONA.WAVE_3.PREMIUM_APP_TILE_RULES.1`)
**Status:** **AUDIT COMPLETE** — static inventory only; tile rules locked; next: Local safety copy visibility pack

**Classification:** Docs/static audit — **not** production launch, **not** commercial/payment readiness, **not** Global Active / full commercial, **not** native production confidence.

**Note:** Working tree may contain **17 unstaged `src/` UX experiments** (not staged or committed). Findings below reflect **read-only inspection** of on-disk consumer surfaces at audit time; implementation packs must not bundle unrelated working-tree edits.

---

## 1. Baseline

| Area | Status | Evidence |
|------|--------|----------|
| Wave 3 prep | **Complete** @ `e2b43ef` | `VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md` |
| Wave 1 Local pilot signoff | **Complete** | `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` |
| Sessions 1–5 | **PASS** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` |
| Wave 2 native RUN.1 | **NOT RUN** | `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` |
| Native production confidence | **Not achieved** | No native checklist PASS |
| Local money law | **Locked** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE** |
| Whole VIONA | Pre-commercial / staging-pilot | `VIONA_PROJECT_KERNEL.md` |
| **Global Active / full commercial** | **Not yet** | Master wave roadmap |

---

## 2. Audit principles (Wave 3 design laws)

| Law | Audit check |
|-----|-------------|
| **Home is design standard** | Shell rail, world cards, semantic accents |
| **Premium App Tiles** | Title + subtitle + icon; status chip where needed |
| **Hybrid layout** | Hero frames vs compact module tiles |
| **Semantic glow** | Gold / Cyan / Emerald / Magenta roles |
| **Short title + concise subtitle** | Per tile/card |
| **No icon-only ambiguity** | a11y labels on tiles |
| **No long consumer dashboard rows** | Flag list-style / ops-dense layouts |
| **Mobile-first responsive** | 390×844 → 1366×768 breakpoints |
| **Multilingual-friendly** | `useTranslation` / locale keys |
| **Safety/trust copy** | Local no-charge; SOS disclaimers; no overclaim |

**Rating scale — design-law alignment:** **GREEN** aligned · **YELLOW** partial drift · **RED** material drift  
**Implementation risk:** **LOW** copy/layout · **MEDIUM** multi-component · **HIGH** touches wallet/booking/SOS logic paths

---

## 3. Surface inventory

### 3.1 Home

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/HomeScreen.tsx` (~4255 lines) |
| **Role** | B2C north-star shell: living hero, fashion command bar, four **world module** entries (Local / Travel / Academy / Business), briefing rail, optional legacy dashboard embed |
| **UX pattern** | **Hybrid:** large hero + `VionaFashionHomeCommandBar` + `VionaFashionWorldCard` grid (image-backed world cards with status pills); horizontal **briefing** scroll; `VionaQuickActionPill` / `VionaInfoTile`; collapsible `DashboardB2CScreen` |
| **Tile/card pattern** | **Reference implementation** for world-stage cards (`VionaFashionWorldCard`); accents: local=emerald, travel=cyan, academy=violet, business=gold |
| **Copy density** | Moderate on world cards (i18n `home.fashionTech.*`); desktop living-hero copy block includes **hardcoded EN** in `LIVING_HERO_DESKTOP_COPY` |
| **i18n** | **YELLOW** — primary tabs/cards use `t()`; living-hero desktop strings not keyed |
| **Safety copy** | SOS via `VionaSosHoldGateModal` / `VionaSosPlusInfoModal`; no payment claims on world cards |
| **Responsive risk** | **MEDIUM** — many web-only layout branches (`fashionHomeDesktopShell`, opening-stage math, carousel vs 2-col vs 4-col world row) |
| **Design-law alignment** | **GREEN** (world cards, semantic glow, hybrid hero) · **YELLOW** (briefing rail = dashboard-adjacent; legacy dashboard; file size) |
| **Implementation risk** | **HIGH** (monolith; easy to break web/native parity) |
| **Do-not-touch** | Admin unlock, SOS gate wiring, B2B role switch, paywall hooks, `DashboardB2CScreen` data paths |

**Shared components audited:** `src/components/viona/VionaFashionWorldCard.tsx`, `fashionHomeDesktopShell.ts`, `VionaFashionHomeCommandBar.tsx`, `VionaInfoTile.tsx`

---

### 3.2 Local

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/b2c/LocalScreen.tsx` (~1655 lines) |
| **Role** | Local hub: service categories, classifieds, booking assist entry, **My requests** entry |
| **UX pattern** | Home-aligned **command rail** (gradient) + `LocalConstellationFrame` hero + `LocalCommerceClarityBlock` + **`LocalAppTile` bento grid** |
| **Tile/card pattern** | **`LocalAppTile`** — compact premium tile (icon, title, subtitle, `statusLabel`, constellation frame) — **best in-class Wave 3 reference** |
| **Copy density** | Moderate; section kickers + per-tile subtitles |
| **i18n** | **GREEN** — `localHub.*`, `localCommerce.*`, `local.userRequestStatus.*` |
| **Safety copy** | **GREEN** — hero chips: lite / pilot / **requestOnly**; clarity block `localCommerce.safety.bookingRequestNote`; dedicated **My requests** tile |
| **Responsive risk** | **LOW–MEDIUM** — `resolveLocalGridColumns` / content rail; web daylight boost |
| **Design-law alignment** | **GREEN** tiles & shell · **YELLOW** (wallet chip in rail shows credits; mixed status vocabulary demo/lite/pilot/preview on tiles) |
| **Implementation risk** | **HIGH** if touching booking (`createBooking`, `runUltraMasterBookingWithAlerts`, `confirmSecurityDepositThen`, `reserveAndCommitCredits`) |
| **Do-not-touch** | Booking mutations, escrow, VIP credit debit, legal-scan pricing flows, API contracts |

**Related surfaces (not primary hub):**

| Path | Role | Alignment |
|------|------|-----------|
| `src/screens/b2c/LocalUserRequestStatusScreen.tsx` | User request list/timeline | **YELLOW** — older `PrecisePanel` / filter chips; **strong safety logic** in `localUserRequestStatusUi.ts` (`confirmedNote`, `requestOnlyNoCharge` badge) |
| `src/components/localCommerce/LocalCommerceClarityBlock.tsx` | Audience + status legend + safety line | **GREEN** trust block |
| `src/components/local/LocalAppTile.tsx` | Tile primitive | **GREEN** |

---

### 3.3 Travel

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/b2c/TravelScreen.tsx` (~1120 lines) |
| **Role** | Travel hub: direction selector, context strip, scenario groups (airport, hotel, emergency, etc.) |
| **UX pattern** | `VionaMiniAppShell` + **`TravelAppTile`** / `TravelScenarioCard` in responsive grid; semantic accents per scenario (`SCENARIO_SEMANTIC`) |
| **Tile/card pattern** | **`TravelAppTile`** + `TravelGlassCard` — aligns with Premium App Tile law (title, subtitle, statusLabel, icon capsule) |
| **Copy density** | Low–moderate per tile; group kickers |
| **i18n** | **GREEN** — travel + weather/fx label keys |
| **Safety copy** | Emergency scenario uses **magenta** accent; no payment wording on hub |
| **Responsive risk** | **MEDIUM** — `travelScenarioGridColumns` (1→4 cols); location consent gate adds cognitive load |
| **Design-law alignment** | **GREEN** |
| **Implementation risk** | **MEDIUM** (GPS/consent + navigation); **LOW** for tile-only polish |
| **Do-not-touch** | `getTravelContext`, cravings radar API wiring unless copy-only |

**Shared:** `src/components/travel/TravelAppTile.tsx`, `TravelGlassCard.tsx`

---

### 3.4 Academy

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/AcademyScreen.tsx` |
| **Role** | Academy hub tab — six learning modules |
| **UX pattern** | `VionaGlobalTopRail` (matches post-Home shell direction) + responsive grid of **`AcademyGlassCard`** modules |
| **Tile/card pattern** | Glass cards with accent (violet/cyan/emerald), title/status/body keys — compact module tiles |
| **Copy density** | Moderate (title + status + body per module) |
| **i18n** | **GREEN** — `academyHub.module*` keys |
| **Safety copy** | N/A on hub; SOS via rail safety assist |
| **Responsive risk** | **LOW** — 1/2/3 column grid @ 640/960 |
| **Design-law alignment** | **GREEN** · **YELLOW** (Vio wallet shortcut on rail — credits surface; tab paywall in navigator) |
| **Implementation risk** | **LOW–MEDIUM** |
| **Do-not-touch** | Paywall / Academy Lite gate messages (`mvpSurfaceGate`) |

**Note:** Legacy learning depth in `HocTapScreen.tsx` / flashcards — out of Wave 3 hub scope unless explicitly added later.

---

### 3.5 Business / Merchant entry

| Field | Finding |
|-------|---------|
| **Consumer entry path** | Home `VionaFashionWorldCard` accent **business** → `MerchantDashboard` or B2B merchant tab if workspace access |
| **Path (destination)** | `src/screens/b2b/MerchantDashboardScreen.tsx` (~1074 lines) |
| **Role** | **Merchant operating workspace** (catalog, radar bookings, revenue demo) — not a consumer daily-use surface |
| **UX pattern** | **Dashboard / ops rows** — list-heavy, switches, demo VIG amounts |
| **Tile/card pattern** | **RED** vs Premium App Tile consumer law (appropriate for B2B ops, not consumer polish target) |
| **Copy density** | High; demo commercial labels (`€`, `VND`, revenue) |
| **i18n** | Partial via `t()` for catalog kinds |
| **Safety copy** | Merchant-facing; must not imply consumer payment is live |
| **Responsive risk** | **MEDIUM** |
| **Design-law alignment** | **YELLOW** (Home **entry** card) · **RED** (dashboard interior vs consumer laws) |
| **Implementation risk** | **HIGH** — B2B/commercial demo semantics |
| **Do-not-touch** | VietQR API, ranking, catalog mutations; Wave 3 limited to **Home business card + entry route clarity** only |

---

### 3.6 Account (`CaNhanScreen` / Personal hub)

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/CaNhanScreen.tsx` (~1150 lines) |
| **Role** | Profile, language, trust history, B2B switch, wallet session dev aids, settings |
| **UX pattern** | Constellation backdrop + **`VionaActionGrid` / `VionaActionCard`** (hex-accent action grid, not constellation tiles) |
| **Tile/card pattern** | Action grid cells — **different grammar** than `LocalAppTile` / `TravelAppTile` |
| **Copy density** | Moderate; section titles |
| **i18n** | **YELLOW** — mix of `getStrings` / `t()` / hardcoded language option labels |
| **Safety copy** | Trust history widget; diaspora restriction modal |
| **Responsive risk** | **LOW** — `ACCOUNT_CONTENT_MAX_WIDTH` 560 |
| **Design-law alignment** | **YELLOW** |
| **Implementation risk** | **MEDIUM** (Firebase wallet dev hooks — do not expand) |
| **Do-not-touch** | `ensureWalletFirebaseAuth`, admin unlock, GDPR data paths |

---

### 3.7 SOS (`EmergencySOSScreen`)

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/EmergencySOSScreen.tsx` |
| **Role** | Emergency hub: dial, embassy map, translation pilot, family assist |
| **UX pattern** | Centered column + **`EmergencyHubTile`** grid + type selector + `EmergencyActionCard` |
| **Tile/card pattern** | Hub tiles with accent (`emergency`, `consular`, `pilot`) — magenta/high-attention appropriate |
| **Copy density** | Moderate; strong disclaimer block |
| **i18n** | **GREEN** — `emergencySos.*`, `sos.footerDisclaimer` |
| **Safety copy** | **GREEN** — `numberDisclaimer`, global disclaimer, **pilot** badge on translation (`emergencySos.pilotBadge`, `ttsPilotDisclaimer`) |
| **Responsive risk** | **LOW** |
| **Design-law alignment** | **GREEN** · **YELLOW** (translation tile could be misread without pilot badge prominence) |
| **Implementation risk** | **LOW** UX-only · **HIGH** if copy implies production reliability |
| **Do-not-touch** | `Linking.openURL(tel:)`, TTS pipeline, location resolution logic |

**Entry points:** Home SOS modals, Local rail safety assist, Academy/Travel rails — keep consistent disclaimers across entries.

---

### 3.8 LeTan / assistant entry

| Field | Finding |
|-------|---------|
| **Path** | `src/screens/LeTanScreen.tsx` (~1678 lines) |
| **Role** | AI receptionist / booking conversation (prefill from Local, SOS family path) |
| **UX pattern** | Chat-first + `OperationalStatusChip` + sell CTA — **not** tile hub |
| **Tile/card pattern** | N/A (conversation UI) |
| **Copy density** | High dynamic messages |
| **i18n** | Partial |
| **Safety copy** | Inline banners; no SOS production claim found in screen |
| **Responsive risk** | **MEDIUM** |
| **Design-law alignment** | **YELLOW** (entry clarity from Local prefill is OK; interior not Premium App Tile) |
| **Implementation risk** | **HIGH** — `chargeTrustedService`, slot locks, wallet sync |
| **Do-not-touch** | Wallet charge, intent detection, B2B queue fetch for Wave 3 |

---

## 4. Local-specific audit (safety invariants)

| Invariant | Audit result |
|-----------|--------------|
| `REQUEST_ONLY_NO_CHARGE` | **Visible** — i18n `local.userRequestStatus.*.requestOnlyNoCharge`; UI logic in `localUserRequestStatusUi.ts` |
| `walletPhase` **NONE** | **Visible** on request rows via wallet badge |
| `paymentCaptured` false | Conveyed via “No payment has been captured” copy (VI/EN) |
| **Confirmed ≠ paid** | **GREEN** — `confirmedNote` / filter chip `confirmed` with explicit note when `shouldShowLocalUserConfirmedNote` |
| No payment/commercial wording on consumer Local hub | **GREEN** on hub; **YELLOW** on some tiles (`demo`, `preview` status labels need consistent legend) |
| No service logic drift | Wave 3 packs must be **UI/copy only** on Local |
| No Ops Audit on consumer tabs | **GREEN** — Ops Audit not on consumer tab bar |

**Gap:** `localCommerce.safety.bookingRequestNote` (EN) does not repeat “confirmed ≠ paid” — that message is stronger on **My requests** than on hub clarity block.

---

## 5. Daily-use UX audit

| Criterion | Home | Local | Travel | Academy | Business entry | Account | SOS |
|-----------|------|-------|--------|---------|----------------|---------|-----|
| Fast entry | GREEN | GREEN | GREEN | GREEN | YELLOW | YELLOW | GREEN |
| Clear next action | GREEN | GREEN | GREEN | GREEN | YELLOW | YELLOW | GREEN |
| Clear status | YELLOW | GREEN | YELLOW | GREEN | RED (ops) | YELLOW | GREEN |
| Trust/safety visible | YELLOW | GREEN | YELLOW | YELLOW | YELLOW | YELLOW | GREEN |
| Low cognitive load | YELLOW | YELLOW | YELLOW | GREEN | RED | YELLOW | GREEN |
| Multilingual clarity | YELLOW | GREEN | GREEN | GREEN | YELLOW | YELLOW | GREEN |
| Merchant/customer understanding | YELLOW | GREEN | N/A | N/A | YELLOW | YELLOW | N/A |

**Summary:** **Local + Travel** are strongest daily-use hubs. **Home** is beautiful but heavy. **Business dashboard** is correctly ops-oriented — polish **entry**, not interior, in Wave 3. **Account** needs clearer hierarchy without expanding wallet features.

---

## 6. Candidate issues (classified)

| ID | Class | Surface | Finding | Severity |
|----|-------|---------|---------|----------|
| V1 | Visual consistency | Home vs Account | World cards vs `VionaActionGrid` grammar differ | Medium |
| V2 | Visual consistency | Local vs My requests | `LocalAppTile` vs `PrecisePanel` list | Medium |
| V3 | Tile/card density | Home | Briefing horizontal rail feels dashboard-like | Low |
| V4 | Copy clarity | Home | Hardcoded EN in `LIVING_HERO_DESKTOP_COPY` | Medium |
| V5 | Safety visibility | Local hub | “Confirmed ≠ paid” stronger on sub-screen than hub | Medium |
| V6 | Copy clarity | Local | Mixed `bookingStatus` chips (lite/pilot/demo/preview) without legend link | Low |
| V7 | i18n | Account | Mixed `getStrings` / hardcoded language rows | Medium |
| V8 | Responsive | Home | Many web layout branches — regression risk at 768/1024 | High |
| V9 | Responsive | Travel | 4-column grid at 1366 — verify tile min width | Medium |
| V10 | Accessibility | Local tiles | Good a11y labels; verify 44px touch on web hover-only affordances | Low |
| V11 | Route/logic risk | Local | UX packs must not open booking/wallet code paths | **Blocker** |
| V12 | Route/logic risk | LeTan | Prefill entry OK; no wallet charge UI expansion | **Blocker** |
| V13 | Copy clarity | Business Home card | Subtitle mentions “growth” — keep pre-commercial tone | Low |
| V14 | Safety visibility | SOS | Keep pilot badge on translation tile prominent | Medium |
| V15 | Visual consistency | Academy | Align module status chips with Home `VionaStatusPill` vocabulary | Low |

---

## 7. Recommended implementation pack order

| Order | Pack ID | Scope | Type |
|-------|---------|-------|------|
| 1 | `WAVE_3.PREMIUM_APP_TILE_RULES.1` | Codify Home / Local / Travel / Academy tile rules | **Docs** |
| 2 | `WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY.1` | Hub clarity + legend; no logic | Copy/UI micro |
| 3 | `WAVE_3.LOCAL_USER_STATUS_CLARITY.1` | `LocalUserRequestStatusScreen` visual align to `LocalAppTile` grammar | Small UI |
| 4 | `WAVE_3.LOCAL_MERCHANT_STATUS_CLARITY.1` | Merchant-facing status (separate runbook scope) | Small UI |
| 5 | `WAVE_3.TRAVEL_PREMIUM_TILE_ALIGN.1` | Scenario grid polish only | Small UI |
| 6 | `WAVE_3.ACADEMY_PREMIUM_TILE_ALIGN.1` | Module card / status pill harmonize | Small UI |
| 7 | `WAVE_3.BUSINESS_ENTRY_CLARITY.1` | Home business world card + route copy only | Small UI |
| 8 | `WAVE_3.ACCOUNT_SURFACE_CLARITY.1` | Account grid hierarchy + i18n cleanup | Small UI |
| 9 | `WAVE_3.SOS_ENTRY_CLARITY.1` | Entry disclaimers alignment; no reliability claim | Copy/UI micro |
| 10 | `WAVE_3.RESPONSIVE_MATRIX.1` | Viewport QA pass | QA docs + fixes |
| 11 | `WAVE_3.A11Y_TOUCH_CONTRAST.1` | Touch/contrast pass | QA |
| 12 | `WAVE_3.UX_READINESS_REVIEW.1` | Wave 3 staging review | Docs |

---

## 8. First implementation pack recommendation

**Next pack (one only):** `VIONA.WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY_VISIBILITY.1`

| Why | Detail |
|-----|--------|
| **Rules complete** | `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` defines shared grammar |
| **Trust-first** | Hub clarity block should surface confirmed≠paid and request-only legend |
| **Small scope** | Copy/micro-UI on Local hub only — no booking/wallet logic |
| **Not yet** | Broad Home refactor — defer until Local packs 1–3 validated on staging |

---

## 9. Locked zones (unchanged)

| Zone | Status |
|------|--------|
| Payment / wallet / commercial implementation | **Locked** |
| Hold / debit / release / refund | **Locked** |
| Settlement / payout / cash-out / escrow | **Locked** |
| Production admin claim | **Locked** |
| Autonomous AI | **Locked** |
| SOS production reliability claim | **Locked** |
| Global Active / full commercial claim | **Locked** |
| Native PASS without attestation | **Locked** |

---

## 10. QA matrix (required for implementation packs)

### Viewports

| Viewport | Primary surfaces |
|----------|------------------|
| **390×844** | Home world row, Local bento, Travel 2-col scenarios |
| **768×1024** | Home web opening stage, Academy 2-col, Account column |
| **1024×768** | Home 2-col / carousel breakpoints, Travel 3-col |
| **1366×768** | Home 4-across world cards, Travel 4-col grid |

### Content checks

| Check | Requirement |
|-------|-------------|
| **VI** | Primary; Local safety strings present |
| **EN** | Parity on audited keys |
| **Local-language readiness** | cs/de partial — document gaps, do not block Wave 3 |
| **No payment/commercial wording** | Consumer hubs + SOS |
| **No overclaim** | No production / native / Global Active in consumer copy |

---

## 11. Relation to native (Wave 2)

| Statement | Valid |
|-----------|-------|
| Wave 3 implementation may proceed while native **NOT COMPLETED** | **Yes** |
| Wave 3 must not claim native production confidence | **Yes** |
| **Wave 2 RUN.2** on stable physical device remains parallel track | **Yes** |

---

## 12. Design-law alignment summary

| Surface | Alignment | Notes |
|---------|-----------|-------|
| **Home** | **GREEN / YELLOW** | North star; reduce briefing/legacy dashboard drift |
| **Local** | **GREEN** | Best tile reference; tighten safety copy on hub |
| **Travel** | **GREEN** | Strong semantic tiles |
| **Academy** | **GREEN** | Rail + module grid aligned |
| **Business entry** | **YELLOW / RED** | Entry YELLOW; dashboard interior RED for consumer tile law |
| **Account** | **YELLOW** | Different grid grammar |
| **SOS** | **GREEN** | Disclaimers + pilot labeling |
| **LeTan** | **YELLOW** | Out of tile scope; logic-heavy |

---

## 13. Next action

1. Run **`VIONA.WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY_VISIBILITY.1`** (first UI pack per tile rules).
2. Keep **Wave 2 RUN.2** pending physical device.
3. Do **not** stage the 17 unrelated `src/` edits.

---

## 14. Related documents

| Doc | Role |
|-----|------|
| `VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md` | Wave 3 prep + pack map |
| `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Premium App Tile rules (**COMPLETE**) |
| `VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md` | Experience principles |
| `VIONA_ACTION_GRID_PATTERN.md` | Action grid (Account) |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` | Local evidence |
