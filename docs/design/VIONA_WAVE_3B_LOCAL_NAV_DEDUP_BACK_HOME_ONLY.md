# VIONA.WAVE_3B.LOCAL_NAV_DEDUP_BACK_HOME_ONLY.1

## Goal
Deduplicate Local navigation. Local already hands off to other universes via the
**"Vũ trụ liên kết"** section (Travel Lite / Business / Academy), so the shared 4-item bottom
tab bar (Hub / Local / Travel Lite / Academy Lite) is redundant on the Local main hub and eats
vertical space. Replace it on Local with compact **Back + Home** glass controls.

## Navigation source audit
- **Bottom nav (4 items):** the **global** React Navigation bottom tab bar in
  `src/navigation/MainTabNavigator.tsx` (colors via `roleTabChrome()` in `tabRoleTheme.ts`).
  Shared across all B2C tab screens — **not** Local-owned.
- **Back / Home / Local-hub contextual controls:** the reusable `VionaBottomEscapeBar`
  (`src/components/viona/VionaBottomEscapeBar.tsx`) — already used by `AcademyScreen` as the
  in-content Back/Home toolbar. Supports `showBack` / `showHome` and an optional `showCurrent`
  ("Local hub") pill.
- **Local top rail:** Local renders its own glass command rail (brand + language/daylight/wallet/
  safety/account utilities) inside `LocalScreen.tsx` — no Back/Home there previously.

## What changed (all in `src/screens/b2c/LocalScreen.tsx`)
1. **Hide the shared bottom nav — Local-scoped only.** Using the documented React Navigation
   per-screen pattern: a `useFocusEffect` calls `tabBarNavigation.setOptions({ tabBarStyle: hidden })`
   on focus and restores `tabBarStyle: undefined` on blur. `tabBarNavigation` is the same
   navigation object as the screen's `navigation`, re-typed as
   `BottomTabNavigationProp<RootTabParamList>` purely to access `tabBarStyle`.
   - This affects **only the Local tab** while focused. Hub / Travel Lite / Academy Lite keep
     their bottom bar fully intact. `MainTabNavigator.tsx`, routes, and other universes are not
     touched.
2. **Compact Back + Home.** Rendered `VionaBottomEscapeBar` with `showBack showHome` at the end of
   the hub content (after "Vũ trụ liên kết", before the scroll tail), mirroring `AcademyScreen`.
   Handlers mirror Academy:
   - `onBack` → `navigation.goBack()` (falls back to Home tab if nothing to pop).
   - `onHome` → `navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home })` (existing Hub route).
3. **No redundant "Local hub" button.** `showCurrent` is intentionally omitted, so the
   "Local hub" current pill never renders on the Local main page.

## Navigation behavior preservation
- No route names changed; no routes deleted; no handlers/business logic changed.
- Back = existing native back behavior; Home = existing Hub tab route.
- Travel / Business / Academy remain reachable via "Vũ trụ liên kết".
- Other tabs' bottom nav is unchanged (restored on blur).

## Visual target
- Lower page is cleaner; the heavy 4-item bar is gone on Local.
- Universe navigation is no longer duplicated (handoff lives only in "Vũ trụ liên kết").
- Back + Home read as VIONA glass pills; no content hidden behind a bar.

## Out of scope (untouched)
HomeScreen, App.tsx, navigation/routes, MainTabNavigator, payment/wallet/VIO, AI/SOS/backend/auth,
classifieds/feed/composer, merchant/B2B logic, image assets.
