# VIONA AF.UI.3 — App-wide visual consistency audit (post Home / SOS)

**Date:** 2026-05-10  
**Last screenshot review:** 2026-05-11 (doc only — no app code edits in this update).  
**Type:** Audit only — **no app UI changes** in this pack.  
**Constraints:** Do not refactor the whole app; do not touch **Home Dynamic Hero**; do not change **SOS behavior** (copy, grid logic, Plus modal); no Stripe/Twilio/API/DB/Auth/payment/AI provider changes; do not change routes unless identifying a **blocker** (routing recommendations here are **product/navigation decisions** for a future pack, not executed in AF.UI.3).

---

## Snapshot vs current captures (2026-05-11)

Cross-check with latest web/native screenshots on `pack-ae3-fashion-tech-home-shell`:

| Surface | Still true? | Notes |
| --- | --- | --- |
| **Account** (`CaNhanScreen`) | **Yes** | **Mixed UI**: executive/light cards, profile stack, shortcuts — not aligned with Home fashion-tech dark shell. |
| **Local** (`LocalScreen`) | **Yes** | **Light trust shell** (`vionaTrust` lane, `VionaCard` classified feel) — not Home/SOS dark premium. |
| **Travel** (`TravelCompanionScreen`) | **Yes** | **Mixed / light**: white-style scenario cards, light chips, vertical list — clashes with SOS/Home dark grid language. |
| **B2B paywall** (`B2BPaywallScreen`) | **Yes** | **Light pricing lane** (merchant daylight gradient) — acceptable B2B lane; still off B2C LifeOS direction (P2). |
| **Academy / `/ai` (TabAi → `LeTanScreen`)** | **Yes** | **Blank body** when unauthenticated: `if (!user) return null;` (~L496) — tab chrome can show while main area is empty (P0 unchanged). |
| **Home** | **Approved** | Fashion desktop shell + dynamic hero — **reference**; do not regress in migration packs. |
| **SOS sheet** | **Approved** | Dark navy sheet, **3×2 / 2×3 / 1-col** web grid, honesty copy, Plus info modal — **reference**; desktop handle/spacing polish **committed** (`fix(sos): polish desktop safety sheet layout`). |
| **AF.UI.2 dashboard pilot** | **Committed** | **`VionaActionGrid` / `VionaActionCard`**, `DashboardB2CScreen` on Home (when not fashion-desktop-only), dev/review route **`/dashboard-preview`** — `feat(ui): add VIONA action grid dashboard pilot`. |

---

## Approved visual references

| Reference | Role |
| --- | --- |
| **Home desktop fashion shell** | Fashion-tech editorial density, `vionaTokens.fashionTech`, command bar / cool glass strips — primary **B2C chrome** north star for non–data-list surfaces. **Approved** — baseline for migrations. |
| **SOS bottom sheet** (`src/screens/b2c/SOSModal.tsx`) | Dark navy panel, thin accent borders, responsive **3 / 2 / 1** action grid on web, readable tiles — **dense action grid** reference. **Approved** — includes committed desktop sheet top rhythm / no-handle-on-wide-web policy. |
| **AF.UI.2 — Multiverse dashboard** (`DashboardB2CScreen` + `/dashboard-preview`) | **`VionaActionGrid`** pilot for Local / Travel / Academy entry — **committed**; preview route for design review without changing production tab chrome. |
| **`docs/design/VIONA_ACTION_GRID_PATTERN.md`** | When to use action grids vs lists; token alignment; SOS honesty guardrails. |
| **`docs/audit/VIONA_AF_UI_ACTION_GRID_AUDIT.md`** | Prior migration inventory; **`VionaActionGrid` / `VionaActionCard`** primitive (AF.UI.2) and pilot notes. |

**Design intent:** Surfaces that are **short lists of discrete actions** should converge toward **dark premium cards + optional responsive grid**, aligned with Home/SOS. **Settings toggles, tables, chat, feeds, and transaction rows** stay out of grid patterns per pattern doc.

---

## Executive summary — priority tiers

| Tier | Count | Theme |
| --- | ---: | --- |
| **P0 — Blocker** | 1 | Broken or empty user-visible route/body where navigation/header implies content. |
| **P1 — Migrate next** | 4 | High-traffic B2C hubs/modals; strong **generation clash** (light cards vs dark LifeOS). |
| **P2 — Later** | 3 | B2B pricing visual lane; secondary modals; incremental polish. |

---

## P0 — Blockers

### P0.1 Academy tab / “AI” hub — blank body when unauthenticated (and edge navigations)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/screens/LeTanScreen.tsx` — early exit **`if (!user) return null;`** (~line 496). Tab route: **`MainTabNavigator`** → `name={MAIN_TAB.B2C.ai}` → component **`LeTanScreen`** (`TabAi` / Academy label). |
| **Current issue** | **Header/tab chrome can show “Academy” while the screen body renders nothing**, producing a **blank** main area (especially if tab focus or deep navigation bypasses the tab-press paywall guard, or during race/hydration). Contributes to “/ai feels blank” reports on web. |
| **Target pattern** | Either: **(A)** Always render a **dark premium placeholder** (honest Academy Lite copy, sign-in CTA, links aligned with `mvpSurfaceGate` messaging) — **no** fake AI responses; or **(B)** **Hide/disable** the tab and `/ai`-class deep links until the surface is ready (product decision). |
| **Risk level** | **High** — UX trust / perceived broken app. |
| **Suggested next pack** | **AF.UI.3b** or **AF.UI.4** — “Academy shell placeholder + navigation coherence” (UI + minimal navigation gating only; **no** AI provider changes). |
| **Code should change later?** | **Yes** — replace `return null` with a designed empty state **or** align routing so the tab is never focused empty. |

**Note:** Tab press often opens **`AuthPaywallModal`** (`MainTabNavigator`); blank state remains a gap for other entry paths (e.g. `navigationRef.navigate('Tabs', { screen: 'TabAi' })` in startup/deep links).

---

## P1 — Should migrate next

### P1.1 Account screen (`CaNhanScreen`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/screens/CaNhanScreen.tsx` |
| **Current issue** | **Long vertical stack** of mixed cards (`profileCard`, `creditsCard`, shortcuts, `identityCard`, `settingsCard`, GDPR, etc.). Uses **`theme.colors.background` / `executive.card`** — **light/executive** lane vs **Home fashion-tech dark** and **SOS** navy. **`__DEV__`** block (“Dev only — TEMP… Copy Firebase ID Token”) is **visible in dev builds** — acceptable for dev only but reads as **legacy/debug UI** in visual review. |
| **Target pattern** | **Fashion-tech dark shell** + **shortcut clusters** via **`VionaActionGrid` / `VionaActionCard`** (or equivalent) for **discrete entry points** (Wallet, B2B switch, partner row where appropriate). Keep **settings list + GDPR** as **list/toggle** layouts per pattern doc — do not grid dense compliance tables. |
| **Risk level** | **Medium** — high visibility; many navigations; must not break compliance blocks. |
| **Suggested next pack** | **AF.UI.5** — Account shell + shortcut grid pilot (scoped sections only). |
| **Code should change later?** | **Yes.** |

---

### P1.2 VIP / login gate modal (`AuthPaywallModal`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/components/AuthPaywallModal.tsx` (used from `MainTabNavigator` for Academy tab gate, and embedded patterns elsewhere). |
| **Current issue** | **White/light card** (`backgroundColor: 'rgba(255,255,255,0.86)'`, dark text on cream). Reads as **pre–VIONA premium** vs **dark glass** SOS/Home. Red/gold CTA is fine; **surface** should match **VionaModalSurface** / fashion-tech dark glass. |
| **Target pattern** | **Dark premium modal**: `vionaTokens.fashionTech` surfaces, thin border, light ink; preserve **`authPaywall.*` i18n** — **no** copy changes required for visual pack. |
| **Risk level** | **Medium** — first-run and tab gate impressions. |
| **Suggested next pack** | **AF.UI.6** — Modal surface harmonization (AuthPaywall + any siblings). |
| **Code should change later?** | **Yes** (styling only). |

---

### P1.3 Local hub (`LocalScreen`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/screens/b2c/LocalScreen.tsx` |
| **Current issue** | Uses **`vionaTrust`** canvas/surface tokens (**light trust lane**) and **`VionaCard`** for classified-style content — **visually “white/local classified”**, not aligned with **Home fashion shell** or **SOS dark grid**. Top-of-hub **actions** (legal scan, posting, categories) are natural **`VionaActionGrid`** candidates per pattern doc (**Local service entry points**). |
| **Target pattern** | **Dark navy shell** (`fashionTech` or controlled gradient) + **action grid** for **primary hub CTAs**; keep **feed/list** for posts — do not replace scrollable classified rows with a grid of fake actions. |
| **Risk level** | **Medium–high** — core B2C tab; posting flows must stay stable. |
| **Suggested next pack** | **AF.UI.7** — Local shell + top action grid only (pilot). |
| **Code should change later?** | **Yes** (incremental). |

---

### P1.4 Travel Companion (`TravelCompanionScreen`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/screens/TravelCompanionScreen.tsx` |
| **Current issue** | **`Colors.background`** / **white-style scenario cards** (`styles.card`), light chips, **large vertical list**. Strong mismatch with **SOS/Home** dark premium. **Honesty copy** is already careful (e.g. no OTA replacement, emergency routing caveats) — **must be preserved**. |
| **Target pattern** | **`VionaActionGrid` + `VionaActionCard`** (or SOS-density tiles) for **scenario picks**; dark glass trust strip; keep **legal/safety disclaimers** readable. |
| **Risk level** | **Medium** — travel safety perception; copy must not regress. |
| **Suggested next pack** | **AF.UI.8** — Travel Companion visual migration (grid + shell only). |
| **Code should change later?** | **Yes.** |

---

## P2 — Later

### P2.1 B2B paywall (`B2BPaywallScreen`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/screens/b2b/B2BPaywallScreen.tsx` |
| **Current issue** | **Light pricing shell** (`SHELL_TOP` / `#F0F3F8` gradient family) with gold accents — intentional “merchant daylight” but **not** aligned with **B2C** LifeOS dark direction. User asked: **do not change payment logic** in visual packs. |
| **Target pattern** | **Dark business pricing surface** (midnight + disciplined gold) — **later**, after B2C pillars stabilize. |
| **Risk level** | **Low–medium** — B2B-only; Stripe/mock CTAs must stay behavior-identical. |
| **Suggested next pack** | **AF.UI.9** or **B2B-AF-UI-1** — B2B visual lane (shell only). |
| **Code should change later?** | **Yes** (styling/layout only). |

---

### P2.2 Language & market — Smart Trio sheet (`SmartTrioLanguageSheet`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/components/smartTrio/SmartTrioLanguageSheet.tsx` (opened via `SmartTrioLanguageChip`). |
| **Current issue** | Generally **dark glass** — **mostly acceptable**. **Desktop:** sheet includes a **top drag handle** (`styles.handle`) — verify **no overlap** with title (mirror **SOS desktop handle policy** if needed). |
| **Target pattern** | Keep **dark glass**; optional **hide handle on wide web** + dedicated top padding (pattern parity with SOS). |
| **Risk level** | **Low**. |
| **Suggested next pack** | **AF.UI.10** — Modal/sheet desktop polish (shared rules with SOS). |
| **Code should change later?** | **Optional / small**. |

---

### P2.3 Account — language-only modal (`CaNhanScreen` inline `Modal`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/screens/CaNhanScreen.tsx` — `languageModalOpen` / `langModalCard`. |
| **Current issue** | **Centered light card** on dim backdrop — second “language” surface besides Smart Trio; **visual inconsistency** with dark LifeOS. |
| **Target pattern** | Reuse **Smart Trio** sheet **or** **`VionaModalSurface`** dark variant; unify **one** language picking UX where product allows. |
| **Risk level** | **Low–medium** (duplicated UX). |
| **Suggested next pack** | Fold into **AF.UI.5** (Account) or **AF.UI.10** (modals). |
| **Code should change later?** | **Yes** (consolidation optional). |

---

### P2.4 Profile switcher sheet (`ProfileSwitcher`)

| Field | Detail |
| --- | --- |
| **Primary code** | `src/components/ProfileSwitcher.tsx` — modal with `sheetHandle`, role rows, embedded `SmartTrioLanguageChip`. |
| **Current issue** | Dark sheet — aligned in tone; **handle** on desktop web may warrant same polish as SOS (non-blocking). |
| **Target pattern** | Optional desktop handle hide + spacing parity. |
| **Risk level** | **Low**. |
| **Suggested next pack** | **AF.UI.10**. |
| **Code should change later?** | **Optional**. |

---

## Recommended next implementation pack (after audit)

1. **AF.UI.4 (or 3b) — P0:** Fix **Academy / TabAi blank** (`LeTanScreen` empty state or navigation coherence). **No AI backend changes.**  
2. **AF.UI.5 — P1:** **Account** dark shell + action grid for **shortcuts** only.  
3. **AF.UI.6 — P1:** **`AuthPaywallModal`** dark premium surface.  
4. **AF.UI.7 — P1:** **Local** dark shell + hub action grid pilot.  
5. **AF.UI.8 — P1:** **TravelCompanion** grid + dark shell (preserve honesty).  
6. **AF.UI.9+ — P2:** B2B paywall dark lane; sheet handle parity (Smart Trio / ProfileSwitcher).

Explicit **non-goals** for all packs above: Home Dynamic Hero edits; SOS behavior/copy changes; payment provider logic; new fake GPS/dispatch claims.

---

## Validation (AF.UI.3 docs task)

From repo root:

- `npm run typecheck`
- `npm run lint`

**2026-05-11 (doc refresh):** `typecheck` **PASS**; `lint` **PASS** (0 errors; existing repo warnings only). No app source changes in this edit.

---

## Change log

| Date | Author | Note |
| --- | --- | --- |
| 2026-05-10 | AF.UI.3 | Initial app-wide visual audit after Home/SOS approval. |
| 2026-05-11 | AF.UI.3 | Snapshot table + references: Home/SOS approved, AF.UI.2 + SOS layout commits noted; `/ai` blank P0 re-verified against `LeTanScreen` (`if (!user) return null`). |
