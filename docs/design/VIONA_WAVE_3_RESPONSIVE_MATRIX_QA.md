# VIONA Wave 3 — Responsive Matrix QA

**Pack:** `VIONA.WAVE_3.RESPONSIVE_MATRIX.1`  
**Status:** **COMPLETE (static)** — code/build evidence recorded; **pixel/visual capture NOT RUN**  
**Date (UTC):** 2026-05-20  
**Classification:** QA evidence — **not** production launch, **not** commercial readiness, **not** native production confidence

---

## 1. Baseline

| Item | Value |
|------|--------|
| **master / origin at QA** | `1a3878a` — `feat(sos): clarify premium SOS entry` |
| **QA method** | Static code review of committed Wave 3 surfaces + `npx tsc --noEmit`, `npm run lint`, `npm run smoke` at HEAD |
| **Visual capture** | **No** device/browser screenshots or screen recordings in this pack |
| **Wave 2 native** | **NOT COMPLETED** — RUN.1 not run; no native PASS claim |
| **VIONA commercial state** | Pre-commercial / staging-pilot foundation |
| **Global Active / full commercial** | **Not yet** |

### Wave 3 polished consumer surfaces (committed)

| Pack | Commit | Surface |
|------|--------|---------|
| Local no-charge safety | `f8f4dc0` | Local hub — `LocalCommerceClarityBlock`, legend |
| Local user status | `535c350` | `LocalUserRequestStatusScreen`, `LocalUserRequestStatusCard` |
| Local merchant status | `13a7ca3` | `LocalMerchantRequestInboxScreen`, `LocalMerchantRequestStatusCard` |
| Travel tiles | `354889b` | `TravelScreen`, `TravelAppTile`, `travelHub` i18n |
| Academy tiles | `e3d5ca2` | `AcademyScreen`, `AcademyGlassCard`, `academyHub` i18n |
| Business entry | `2497383` | Home `home.fashionTech.business` / `worldStage.business` + desktop hero copy block |
| Account | `42571e5` | `CaNhanScreen`, `accountHub` i18n |
| SOS entry | `1a3878a` | `EmergencySOSScreen`, `EmergencyHubTile`, `emergencySos` i18n |

**Out of Wave 3 polish scope (referenced only):** `LeTanScreen` (conversation UI), `MerchantDashboard` interior, full `HomeScreen` layout (except Business entry copy).

**Working tree note:** 11 unrelated unstaged `src/` files present at QA time — **not** included in this baseline.

---

## 2. QA method and limits

| Layer | Performed | Notes |
|-------|-----------|-------|
| Responsive breakpoint logic | Yes | Grid column helpers, max-width columns, `numberOfLines`, min heights reviewed in source |
| Premium tile anatomy | Yes | Icon chip ~44px, title/subtitle scale, status pills/badges on Wave 3 components |
| EN/VI i18n keys for Wave 3 | Yes | Keys present under `local.*`, `travelHub`, `academyHub`, `accountHub`, `emergencySos`, `home.fashionTech.business` |
| cs/de/fr parity for Wave 3 keys | Partial | New hub keys fall back to EN (see issues) |
| Pixel overflow / clipping | **NOT RUN** | Requires manual browser or device pass |
| Native shell | **NOT RUN** | Wave 2 device matrix pending |

**Legend for matrix cells:**

| Status | Meaning |
|--------|---------|
| **PASS** | Static review: layout logic + copy/safety meet Wave 3 rules; no blocker found in code |
| **PARTIAL** | Static PASS with known gap (e.g. visual not verified, or minor i18n fallback) |
| **FAIL** | Blocker/high issue found in static review |
| **NOT RUN** | Surface/viewport not assessed |

---

## 3. Responsive matrix (surface × viewport)

### 3.1 Home — Business entry / world card

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PARTIAL | Business card uses `VionaFashionWorldCard` + i18n subtitle; pilot status pill. Full Home layout not re-audited. | No | No |
| 768×1024 | PARTIAL | Same; web/desktop shell branches exist on Home (unstaged edits not in baseline). | No | No |
| 1024×768 | PARTIAL | World row breakpoints in `fashionHomeDesktopShell` — static only. | No | No |
| 1366×768 | PARTIAL | 4-across world row per audit; Business gold accent + pilot chip in code. | No | No |

### 3.2 Local hub

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | `resolveLocalGridColumns`: 2 cols @ ≥360px; `LocalAppTile` minHeight 44; `LocalCommerceClarityBlock` on hub. | No | No |
| 768×1024 | PASS | 3-col bento @ ≥768px. | No | No |
| 1024×768 | PASS | 4-col @ ≥1024px. | No | No |
| 1366×768 | PASS | 4-col desktop max. | No | No |

### 3.3 Local — My Requests (user status)

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | Filter chips horizontal scroll; `LocalUserRequestStatusCard` tile grammar; safety strip + pills. | No | No |
| 768×1024 | PASS | List column layout; max-width via shell. | No | No |
| 1024×768 | PASS | Same. | No | No |
| 1366×768 | PASS | Same. | No | No |

### 3.4 Local — Merchant inbox (status)

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | `LocalMerchantRequestStatusCard`; inbox safety strip; filter chips. | No | No |
| 768×1024 | PASS | B2B inbox layout unchanged structurally; tile rows. | No | No |
| 1024×768 | PASS | Same. | No | No |
| 1366×768 | PASS | Same. | No | No |

### 3.5 Travel hub

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | 2-col scenarios @ ≥360; quick-help row 3-up; pilot strip; `TravelAppTile` 44px + chips. | No | No |
| 768×1024 | PASS | 3-col @ ≥768; tabletFullWidth shell on web. | No | No |
| 1024×768 | PASS | 4-col @ ≥1024 (`travelScenarioGridColumns`). | No | No |
| 1366×768 | PARTIAL | 4-col at 1366 — tile width ~23.2%; short subtitles help; **visual min-width not verified**. | No | No |

### 3.6 Academy hub

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | 1-col modules; pilot strip; `AcademyGlassCard` ~108px min, 44px icon. | No | No |
| 768×1024 | PASS | 2-col @ ≥640px; max width 1040. | No | No |
| 1024×768 | PASS | 3-col @ ≥960px. | No | No |
| 1366×768 | PASS | 3-col within max-width column. | No | No |

### 3.7 Account (Cá nhân)

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | `ACCOUNT_CONTENT_MAX_WIDTH` 560; action grid 2-col quartet; pilot strip; setting rows minHeight 44. | No | No |
| 768×1024 | PASS | Centered column; `VionaActionGrid` width hint. | No | No |
| 1024×768 | PASS | Same. | No | No |
| 1366×768 | PASS | Same. | No | No |

### 3.8 SOS entry

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| 390×844 | PASS | `emergencyContentColumnStyle` max 520; hub tiles 48% width, min ~118px; pilot strip; 44px icon row. | No | No |
| 768×1024 | PASS | Centered column. | No | No |
| 1024×768 | PASS | Same. | No | No |
| 1366×768 | PASS | Same. | No | No |

### 3.9 LeTan / assistant (risk reference only)

| Viewport | Status | Issue summary | Screenshot/video | Fix required |
|----------|--------|---------------|------------------|--------------|
| All | **NOT RUN** | Out of Wave 3 scope — chat UI, wallet charge paths; no tile polish pack. | No | N/A |

---

## 4. Premium App Tile grammar (summary)

| Surface | Icon | Title | Subtitle | Status chip | No icon-only | No dense grid paragraphs |
|---------|------|-------|----------|-------------|--------------|---------------------------|
| Local hub tiles | PASS | PASS | PASS | PASS | PASS | PASS |
| Local user/merchant cards | PASS | PASS | PASS | PASS | PASS | PASS |
| Travel scenarios | PASS | PASS | PASS | PASS | PASS | PASS |
| Academy modules | PASS | PASS | PASS | PASS | PASS | PASS |
| Account actions | PASS | PASS | PASS | PASS (badges) | PASS | PASS (grid subtitles ≤3 lines in component) |
| SOS hub tiles | PASS | PASS | PASS | PASS | PASS | PASS |
| Home Business card | PASS | PASS | PASS | PASS (pilot) | PASS | PASS (world card pattern) |

---

## 5. Safety / copy matrix (universe)

| Universe | Safety copy | Overclaim | i18n (EN/VI) | Risk |
|----------|-------------|-----------|--------------|------|
| **Local** | **PASS** — request-only, no charge, confirmed ≠ paid on hub + user/merchant surfaces | **PASS** — no paid booking/settlement in Wave 3 keys | **PASS** — `localCommerce`, `local.userRequestStatus`, `local.merchantInbox` | **Low** |
| **Travel** | **PASS** — pilot strip; preview/demo/lite chips; no checkout copy | **PASS** | **PASS** — `travelHub` | **Low** |
| **Academy** | **PASS** — beta/preview; not production tutor/certification | **PASS** | **PASS** — `academyHub` | **Low** |
| **Business** | **PASS** — preview workspace; not commercial launch; no payouts active | **PASS** | **PASS** — `home.fashionTech.business`, `worldStage.business` | **Low** |
| **Account** | **PASS** — self-declared, in-app only, no global KYC/payment rails | **PASS** — no cash-out/payout in new keys | **PASS** — `accountHub` (+ legacy `strings.ts` profile for alerts) | **Low** |
| **SOS** | **PASS** — guidance pilot; no rescue coverage; you place call; no auto alert | **PASS** — existing `sos.footerDisclaimer` retained | **PASS** — `emergencySos`, `sos.footerDisclaimer` | **Low** |

**Locked zones verified (no new violations in Wave 3 committed diffs):** payment/wallet implementation claims, hold/debit/release/refund consumer promises, settlement/payout/cash-out/escrow, Global Active, production native PASS, autonomous AI on consumer tiles.

---

## 6. i18n / local-language readiness

| Check | Status | Notes |
|-------|--------|-------|
| EN + VI for Wave 3 hub keys | **PASS** | Added keys in `en.json` / `vi.json` for Travel, Academy, Account, SOS, Business, Local status packs |
| cs / de / fr / ja / ko for new hub keys | **PARTIAL** | `accountHub`, `emergencySos.pilotStrip*`, `travelHub.pilot*` etc. **not** duplicated — i18next falls back to EN |
| Hardcoded public copy (Wave 3) | **PASS** | New consumer copy keyed; exception: pre-existing `LIVING_HERO_DESKTOP_COPY` on Home (EN only, not introduced by Wave 3) |
| `getStrings` profile (Account alerts) | **PASS** | Unchanged; Account hub uses `useTranslation` for Wave 3 strip/tiles |
| Copy density | **PASS** | Subtitles shortened in packs; `numberOfLines` used on strips |

---

## 7. Issues register

| ID | Class | Surface | Summary | Fix pack |
|----|-------|---------|---------|----------|
| W3-RM-01 | **MEDIUM** | All viewports | **Visual/pixel QA NOT RUN** — no screenshots; recommend manual spot-check on web @ 390/768/1024/1366 before external demo | `WAVE_3.RESPONSIVE_VISUAL_SPOTCHECK` (optional) or manual QA |
| W3-RM-02 | **LOW** | i18n | Wave 3 hub keys missing in cs/de/fr — EN fallback | Future i18n expansion or document as accepted |
| W3-RM-03 | **LOW** | Home | `LIVING_HERO_DESKTOP_COPY.business` hardcoded EN on desktop hero | `HOME_I18N` pack (out of Wave 3) |
| W3-RM-04 | **LOW** | Travel | 4-col grid at 1024–1366 — min tile width not pixel-verified | Visual spot-check only |
| W3-RM-05 | **LOW** | Repo hygiene | 11 unstaged unrelated `src/` files — do not mix into Wave 3 releases | Keep unstaged |

**No BLOCKER or HIGH** issues found in static review at `1a3878a`.

---

## 8. Forbidden wording grep (Wave 3 consumer keys)

Static grep on committed Wave 3 i18n namespaces (`travelHub`, `academyHub`, `accountHub`, `emergencySos` pilot/hub keys, `local.merchantInbox`, `local.userRequestStatus`, `home.fashionTech.business`):

| Pattern | New violations in Wave 3 keys |
|---------|-------------------------------|
| production ready / Global Active ready / commercial ready | None |
| cash-out / withdraw / payout / settlement / escrow | None in new keys (negation-only elsewhere pre-existing) |
| paid booking / guaranteed booking / provider paid | None |
| rescue guaranteed / we will send help | None |
| Positive “dispatch” as service promise | None in new keys (legacy SOS strings retain “does not dispatch” negations) |

---

## 9. Build validation (HEAD `1a3878a`)

| Check | Result |
|-------|--------|
| `git diff --check` | PASS (no conflict markers; unrelated unstaged files only) |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (0 errors; pre-existing warnings) |
| `npm run smoke` | PASS |

---

## 10. Decision

| Verdict | **PARTIAL** |
|---------|-------------|
| Rationale | All Wave 3 polished surfaces **PASS** static tile grammar, safety copy, and responsive **logic**. **No** blocker/high code defect. **Visual pixel matrix NOT RUN** (W3-RM-01). |
| Safe to proceed? | **Yes** — to **`VIONA.WAVE_3.UX_READINESS_REVIEW.1`** with documented manual visual spot-check recommended before external stakeholder demo. |
| Wave 2 | Keep **RUN.2** on physical device **pending** — not gated on this doc alone. |

---

## 11. Next recommendation

1. Run **`VIONA.WAVE_3.UX_READINESS_REVIEW.1`** — staging signoff checklist consolidating Wave 3 packs + Local pilot evidence.
2. Optional: **manual visual spot-check** (30–45 min) on web for Local, Travel, Academy, Account, SOS @ four viewports; capture screenshots if marketing needs assets.
3. Do **not** stage the 11 unrelated `src/` edits until their own packs land.
4. Parallel: **Wave 2 RUN.2** native device when hardware available.
5. No targeted fix pack required before readiness review unless visual spot-check finds clipping (then file per-surface micro-fix).

---

## 12. Related documents

| Document | Role |
|----------|------|
| `docs/design/VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Tile grammar law |
| `docs/design/VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md` | Surface inventory |
| `docs/design/VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md` | Wave 3 prep |
| `docs/handoff/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md` | Local pilot PASS evidence |
| `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` | Commercial gating |
