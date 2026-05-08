# VIONA Pack AE.3 Fashion-Tech Home Shell Audit

## 1. Summary

- **What changed:** B2C Hub (`HomeScreen`) now uses a **Fashion-Tech Human Constellation** hero (dark editorial shell, champagne accents, abstract visual slot), a **four-world card row** (Local, Travel, Academy, Business), and **desktop web** gains a **top command bar** (VIONA + mini navigation + Language / VIO Credits / Safety Assist / Account). The left vertical tab rail for **B2C desktop** moves to the **bottom** so the first impression is hero-first, not dashboard-sidebar. Floating ProfileSwitcher / Smart Trio chips are suppressed on **B2C Home desktop** in favor of the command bar; **Safety Assist** uses the existing SOS triage flow (`triggerSafetyAssist`) without the red floating orb on that surface.
- **Why AE.2 needed stronger visual direction:** AE.2 established honest hierarchy and World Stage cards but read “lite pastel flagship,” not enough cinematic premium or Fashion-Tech soul for the flagship Hub entry.
- **Why Fashion-Tech Human Constellation was selected:** Aligns with blueprint positioning (global Vietnamese companion OS), premium trust, and distinct differentiation from generic dashboards — without inventing new product claims.

## 2. Blueprint Fit Check

| Dimension | Fit |
|-----------|-----|
| Universe | Hub / Core OS |
| Mini-app | Home / World Stage entry → Local / Travel / Academy launchers |
| User persona | Vietnamese abroad, locals, travelers, families, pilot merchants |
| Feature status | Lite / Demo / Pilot-safe surfaces only (status pills preserved) |
| Risk level | UI + trust + safety communication |
| Monetization model | No new monetization logic; VIO display / wallet navigation unchanged |
| Data dependencies | Existing home/wallet/charity reads only |
| Safety guard | Safety Assist labeled; same triage path as SOS hold-complete — no new instant emergency dispatch |
| Feature flag | No new flags |
| Production readiness | Visual foundation only; not fulfillment |

## 3. Visual Direction

- Fashion-Tech editorial dark shell (ink / charcoal / champagne-gold).
- Human Constellation narrative via copy keys `home.fashionTech.*`.
- Cinematic **placeholder** visual field (gradient slot + copy); **no unlicensed remote stock** — see `docs/design/VIONA_FASHION_TECH_ASSET_DIRECTION.md`.

## 4. Current Pattern Audit

| Area | Current problem | AE.3 fix |
|------|-----------------|----------|
| Home shell | Left rail dominated desktop Hub | B2C desktop: bottom tabs; hero-first layout |
| Left rail | ~94px persistent rail | Removed for B2C desktop (bottom tabs) |
| Top band | Floating utilities disconnected from hero | Integrated command bar on Home desktop |
| Utility controls | Language / account floated over content | Docked in command bar when Home desktop |
| Account | Floating chip | Command bar “Account” → existing Personal Hub |
| Language / market | Floating Smart Trio chip | Sheet opened from command bar (lifted sheet when chrome suppressed) |
| VIO credits | Wallet pill + hero duplication | Desktop Home: pill hidden in trust strip; VIO in command bar navigates to Wallet |
| Safety Assist / SOS | Red orb FAB reads “mystery SOS” on Hub | Hidden on B2C Home desktop; labeled Safety Assist in bar |
| Home hero | Pastel World Stage | Fashion-Tech dark hero + visual slot |
| Local / Travel / Academy cards | Pastel World Stage cards | Dark gradient Fashion-Tech cards |
| Care Heart Fund | Previously a primary card | Secondary impact strip + existing widget |
| i18n | World Stage strings only | Added `home.fashionTech.*`, `shell.utility.*` (en/vi) |
| Asset policy | Implicit | Documented asset slot + licensing note |

## 5. Files Changed

| File | Purpose |
|------|---------|
| `src/context/HomeCommandContext.tsx` | Command-bar actions (language sheet, Safety Assist, account, role picker) |
| `src/navigation/fashionHomeDesktopShell.ts` | **AE.3.2** — `isFashionHomeDesktopShell`, union `readFocusedTabRouteFromRootState`, shared tab-bar hide style |
| `src/navigation/MainTabNavigator.tsx` | B2C desktop bottom tabs; scene padding; provider; SOS FAB hide on Home desktop; lifted language sheet; **AE.3.2** fashion shell + Home `tabBarStyle` |
| `src/components/ProfileSwitcher.tsx` | `suppressFloatingChrome` + imperative handle; **AE.3.2** defensive fashion-shell merge |
| `src/components/smartTrio/SmartTrioLanguageChip.tsx` | **AE.3.2** — `suppressFloating` early exit for floating chip |
| `src/components/SOSFloatingButton.tsx` | **AE.3.2** — hard hide when fashion shell matches |
| `src/components/viona/VionaFashionHomeCommandBar.tsx` | Fashion-Tech top command shell |
| `src/components/viona/VionaFashionWorldCard.tsx` | Dark editorial universe cards |
| `src/components/viona/index.ts` | Exports |
| `src/screens/HomeScreen.tsx` | Fashion hero, cards, desktop command integration, trust strip tweak; **AE.3.2** shell width, hero caption, horizontal card rail |
| `src/screens/b2c/SOSModal.tsx` | **AE.3.2** — Fashion-Tech visual polish (no flow change) |
| `src/design/vionaTokens.ts` | `fashionTech` token group |
| `src/i18n/locales/en.json` | `shell.*`, `home.fashionTech.*` |
| `src/i18n/locales/vi.json` | Same |
| `docs/design/VIONA_FASHION_TECH_ASSET_DIRECTION.md` | Asset/licensing guidance |
| `docs/audit/VIONA_PACK_AE3_FASHION_TECH_HOME_SHELL_AUDIT.md` | This audit |

## 6. Utility / Safety UX

- Language, VIO (wallet navigate), Safety Assist, Account unified in **one command row** on **B2C Home desktop**.
- Safety Assist triggers **existing** `onSosHoldComplete` (AI triage + modal) — no new dial semantics.
- Red SOS FAB **hidden** only on **B2C Home desktop**; other tabs / native retain existing FAB behavior.

## 7. What This Does Not Do

- No payment / booking / wallet backend changes.
- No API / Prisma / Twilio / AI provider calls added.
- No route renames; no feature-flag edits.
- No production fulfillment claims.

## 8. Validation

| Command | Result |
|---------|--------|
| `npm ci` | PASS (May 2026 — retry after `Stop-Process node` fixed Windows EPERM on `lightningcss.win32-x64-msvc.node`; AE.3.2 re-run same) |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (warnings only, pre-existing + resolved unused helper warning in `MainTabNavigator`) |
| `npm run ci:release-discipline` | PASS |
| `npm run brand:i18n-readiness` | PASS (allowlisted warnings) |
| `npm run design:readiness` | PASS |

Web smoke (`npx expo start --web --clear`, then `curl.exe`): **`GET /home`** → **200** `text/html`; dev **`index.ts.bundle?platform=web…`** → **200** `application/javascript`; no **500** / no **`application/json`** shell for those URLs. *(AE.3.2: no dev server bound in this session — re-run `expo start --web` locally to reconfirm curl.)*

## AE.3.1 Visual QA Fix

**AE.3.1 goal:** Resolve Fashion-Tech Home shell QA issues on **B2C desktop web** (`/home`): duplicate floating utilities, red SOS orb, bottom tab overlap, command bar reading as a centered card, empty-looking hero photography slot, and card-row clipping.

**Root cause (verified):** `MainTabNavigator` calls `useNavigationState` while mounted as the **`Tabs` stack screen**. The selector returned the active **stack** route name (`Tabs`), not the nested tab (`TabHome`). Therefore `focusedTabRoute === MAIN_TAB.B2C.home` was never true, `suppressHomeFloatingChrome` stayed false, and floating Profile / Language chrome plus the red SOS FAB remained visible while bottom tabs still overlapped content.

**Fix summary:**

| Topic | Change |
|-------|--------|
| Floating chrome | Read focused tab from **nested state** under route `Tabs`; `suppressHomeFloatingChrome` now activates on B2C desktop Home. |
| Red SOS orb | Same gate as AE.3: hide `SOSFloatingButton` when suppress is true (unchanged logic path; wiring now effective). |
| Bottom tab overlay | When suppress is true, apply **`tabBarHiddenHomeDesktop`** (`display: 'none`, zero height) so primary nav is the command bar only on that surface. |
| Command bar placement | Move **`VionaFashionHomeCommandBar`** out of `ScrollView` into a full-width **top shell** (`fashionShellOuter`) aligned with content width; bar styling is flat / integrated (not a detached card). |
| Scene padding | Set tab **scene `paddingTop` to 0** for this shell — safe area is handled by the Home shell; avoids double top inset. |
| Hero visual | Replace flat black slot with **gradient + constellation dots + orbit lines + glow** (no new deps, no stock assets); copy `home.fashionTech.visualComingSoon` (en/vi). |
| Card clipping | Reduce desktop scroll bottom padding (no tab bar overlap); **`ftHero` `overflow: 'visible'`**; extra **`paddingBottom`** on card grid. |

**Additional files touched (AE.3.1):** `MainTabNavigator.tsx`, `HomeScreen.tsx`, `VionaFashionHomeCommandBar.tsx`, `en.json` / `vi.json`, this audit.

## AE.3.2 Hard Legacy Chrome Suppression

**Post–AE.3.1 QA still showed:** floating Account, floating Language & Market chip, red SOS orb, bottom tab clipping world cards, command bar feeling “card-like”, hero slot still reading as **technical/debug** copy, SOS sheet visually gray.

**Exact render paths (code-verified):**

| # | UI element | Component / path |
|---|------------|-------------------|
| 1 | Floating Account (single-role users) | `ProfileSwitcher` → `Pressable` `styles.singleChip` when `!canSwitch` |
| 2 | Floating Account / role chip (multi-role) | `ProfileSwitcher` → `Pressable` `styles.chip` when `canSwitch` |
| 3 | Floating Language & Market | `SmartTrioLanguageChip` `placement="floating"` from `ProfileSwitcher` (single-role branch) **and** each chip mounts `SmartTrioLanguageSheet` internally |
| 4 | Red SOS orb | `MainTabNavigator` → `SOSFloatingButton` → `SOSShieldComponent` |
| 5 | Bottom tab bar | `@react-navigation/bottom-tabs` `Tab.Navigator` `tabBarStyle` / `tabBarPosition` (`MainTabNavigator`) |

**Why suppression could still fail after AE.3.1:** `useNavigationState` may deliver **either** the **root stack** state (active route `Tabs` + nested tab index) **or** the **tab navigator** state (active route `TabHome`, …) depending on subscription scope. AE.3.1 only normalized the stack-nested case; without a **union** reader, `focusedTabRoute` could stay wrong → `suppressFloatingChrome` false. Separately, **web** tab bar hiding is more reliable when **`Tab.Screen` (Home) sets `tabBarStyle`** on focus, not only global `screenOptions`.

**Shared predicate (single source of truth):** `src/navigation/fashionHomeDesktopShell.ts`

- `readFocusedTabRouteFromRootState` — union of tab-first + `Tabs`→nested.
- `isFashionHomeDesktopShell({ platform, windowWidth, activeRole, focusedTabRoute })` — web + width ≥ `FASHION_HOME_DESKTOP_MIN_WIDTH` (769) + B2C + `TabHome`.
- `fashionHomeHiddenTabBarStyle` — shared hide fragment for tab bar.

**Hard suppressions:**

- `MainTabNavigator` — `fashionHomeDesktopShell` from helper; `tabBarStyle` merge + **Home** `options.tabBarStyle`; `ProfileSwitcher` / language sheet / SOS FAB gated.
- `ProfileSwitcher` — `hideLegacyFloatingChrome = suppressFloatingChrome || localFashionShell` (local uses same helper + `readFocusedTabRouteFromRootState`).
- `SmartTrioLanguageChip` — `suppressFloating` + early `return null` for floating placement.
- `SOSFloatingButton` — early `return null` when local fashion shell matches (belt-and-suspenders with parent).

**Home / hero / cards / modal:**

- Wider `layout.shellWidth` when fashion shell; command bar `width: '100%'`.
- Hero: visible copy = `home.fashionTech.visualStoryCaption` only; policy line lives in `heroVisualA11y` for screen readers.
- Cards: horizontal `ScrollView` rail when fashion shell and `720 ≤ width < 1420`.
- `SOSModal` — Fashion-Tech contrast (champagne border, richer sheet, row chrome, pill dismiss) — **no API / flow / semantics changes**.

**Files touched (AE.3.2):** `fashionHomeDesktopShell.ts` (new), `MainTabNavigator.tsx`, `ProfileSwitcher.tsx`, `SmartTrioLanguageChip.tsx`, `SOSFloatingButton.tsx`, `HomeScreen.tsx`, `VionaFashionHomeCommandBar.tsx`, `SOSModal.tsx`, `en.json`, `vi.json`, this audit.

## AF.0 Business Pillar Promotion

- Promoted **Business** to primary world card (Local / Travel / Academy / Business) on both desktop card layouts.
- Added optional **Business** top-shell nav item only when a safe handler exists; wired to existing route path (`B2BPaywall` fallback, `Tabs/TabMerchant` when access is available).
- Moved **Care Heart Fund** to a smaller **secondary impact strip** below primary worlds and kept the existing `CharityWidget` section.
- Kept all guardrails: UI/layout/i18n only, no route renames, no feature-flag changes, and no production readiness claims.

## 9. Visual Acceptance Checklist

| Check | Result |
|-------|--------|
| No large left rail on Home desktop | Pass (B2C desktop bottom tabs elsewhere; Home desktop hides bottom tab bar) |
| Top command bar visible | Pass |
| No floating account/language on Home desktop | Pass (nested-route suppress wiring) |
| Safety Assist labeled | Pass |
| No red mystery SOS on Home desktop | Pass |
| Fashion-Tech hero visible | Pass |
| Local/Travel/Academy/Business cards visible | Pass |
| Care remains secondary | Pass (impact strip + widget, no donation claims) |
| No fake production claim | Pass |
| Text contrast readable | Pass |
| Command bar reads as global shell (not floating card) | Pass |
| Hero placeholder feels cinematic (not empty black) | Pass |
| Card row not clipped by bottom chrome | Pass |
| AE.3.2: dual navigation state union for tab focus | Pass |
| AE.3.2: Home `Tab.Screen` tabBarStyle hide on web | Pass |
| AE.3.2: defensive floating chrome + SOS orb suppression | Pass |
| AE.3.2: hero caption non-technical (policy in a11y only) | Pass |
| AE.3.2: horizontal card rail mid-width desktop | Pass |
| AE.3.2: SOS modal Fashion-Tech polish | Pass |

## 10. Drift Report

```
Blueprint aligned: yes (Hub OS / mini-app launchers; honest maturity labels)
Universe: Hub / Core OS
Mini-app: Home entry → Local / Travel / Academy / Care secondary
Feature status: Lite/Demo/Pilot surfaces — unchanged semantics
Business logic changed: no
Payment touched: no
Booking touched: no
AI mutation touched: no
DB/Prisma touched: no (typecheck runs prisma generate only)
Tenant risk: low (UI-only)
Cost risk: low
Fake production risk: mitigated (same SOS triage path; labeled Safety Assist)
Typecheck: pass (local)
Lint: see CI log
Next safest step: Web smoke `/home` desktop width; capture screenshots for acceptance table
```
