# VIONA Wave 3B — Local background premium revert + navigation dedup

**Task:** `VIONA.WAVE_3B.LOCAL_BACKGROUND_PREMIUM_REVERT_AND_NAV_DEDUP.1`
**Scope:** `src/screens/b2c/LocalScreen.tsx` only (no IA, route, hero/card image, payment/AI/SOS/merchant, or Home changes).

## A. Background premium correction

### Problem
The previous "daylight" pass painted the whole page in a flat, bright teal wash
(`#1A434C → #0C2730 → #0A2128`), which read as a single cheap teal layer and flattened the
premium depth of the dark-glass hero/cards.

### Fix
Replaced the flat-teal palette with a deep premium ambient stage and renamed the constants/
helpers from `LOCAL_DAYLIGHT_*` / `LocalDaylightShellBackdrop` to `LOCAL_PREMIUM_*` /
`LocalPremiumShellBackdrop` for clarity. The backdrop still sits above the shared shell's
opaque night canvas and below the Local content, and stays theme-invariant.

New stage:
- **Base / page canvas (web `html`/`body` + `container`):** `#0A1622` — deep navy, brighter
  than the legacy cyber-night (`localConstellation.canvas` = `#050B14`) but still deep.
- **Vertical gradient:** `#0E2731` (deep teal-navy lift near top) → `#0A1622` (deep navy) →
  `#06130F` (emerald-black foot), locations `[0, 0.5, 1]`.
- **Warm golden-hour glow:** confined to the hero/top band only — web radial
  `120% 70% at 50% -10%` at `rgba(255,214,152,0.13)` fading to transparent by ~52%; native
  uses an equivalent top-anchored vertical fade.
- **Subtle emerald/cyan network:** a low-alpha diagonal aurora
  (`emerald rgba(72,210,165,0.07)` → transparent → `cyan rgba(98,206,255,0.05)`).

### Result
- Background reads premium and deep, not flat teal.
- No full-page photo background (the gradient stage covers the shell's luminous image base).
- Warm light is localized near the hero; the rest settles into navy/emerald-black so the
  hero/card frames pop and text contrast stays strong.
- No white gutters (web `html`/`body` painted with the deep base + `overflow-x: hidden`).

## B. Navigation deduplication

### Problem
The Local main hub showed two competing navigation systems:
1. A Local-only **floating dock** (Back / Home / Local hub) pinned to the bottom.
2. The **global bottom tab bar** (Overview / Local / Travel / Academy) from
   `MainTabNavigator`.

The floating "Local hub" button is redundant on the Local main page (the page *is* the Local
hub), and Back/Home duplicate what the global tab nav already provides.

### Fix (Local main hub only)
- Removed the `LocalMiniappDock` render, its component definition, and its styles
  (`miniappDockHost/Dock/Btn/BtnActive/BtnText/BtnTextActive`).
- Removed the now-unused callbacks `goHome`, `goBack`, `scrollToTop` and the
  `miniappDockBottom` offset.
- Dropped `withMiniappDockClearance` from `PremiumAppShell` so the reclaimed bottom space is
  no longer reserved (improves dock clearance; Local For You + Classifieds are less
  obstructed). `withTabBarClearance` is unchanged — the global tab bar stays present.

### Safety
- No route handlers/definitions removed; only local helper callbacks that solely fed the dock.
- The global bottom tab bar / desktop left rail (`MainTabNavigator`, `createBottomTabNavigator`)
  is untouched and remains the reachable navigation.
- The dock component was used only inside `LocalScreen` (the main hub), so no nested/detail
  subpage loses navigation chrome.
- The unused i18n keys `localHub.miniappDock{Back,Home,Local}` are left in place (harmless).

## Acceptance
- Background feels premium, not flat teal; hero/card frames still pop; no white gutters; no
  heavy night/cyber overload.
- Local main page no longer shows both navigation systems; global navigation remains
  reachable; bottom area is less obstructed.
