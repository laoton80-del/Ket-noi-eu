# VIONA.WAVE_3B.LOCAL_BOTTOM_NAV_PREMIUM_PARITY_FIX.1

## Goal
Lightly polish the bottom navigation bar shown on Local (Overview / Local / Travel Lite /
Academy Lite) so it reads as VIONA premium glass instead of a flat default navy slab — without
changing any navigation behavior, routes, labels, handlers, or business logic.

## Source of the bar
The bar is the **global React Navigation bottom tab bar** defined in
`src/navigation/MainTabNavigator.tsx`. It is not Local-owned. Its colors come from
`roleTabChrome()` in `src/navigation/tabRoleTheme.ts`, keyed by the active role. Local runs under
the **B2C** role, so it uses the B2C (non-Travel) chrome branch.

Because the bar is shared, the polish was scoped so only the B2C consumer chrome changes visually;
B2B / Broker / Admin / Travel-platinum chromes are untouched, and the web blur is a no-op over their
opaque backgrounds.

## Changes

### 1. `src/navigation/tabRoleTheme.ts` — B2C consumer chrome only
| token | before | after | reason |
| --- | --- | --- | --- |
| `barBg` | `#061A33` (flat opaque slab) | `rgba(8, 20, 38, 0.9)` | dark translucent navy → reads as glass with the web blur; high opacity keeps it clean on native |
| `barBorder` | `rgba(79, 140, 255, 0.28)` | `rgba(124, 196, 255, 0.44)` | crisper soft cyan/blue top edge-light (still subtle, not neon) |
| `active` | `#6EB0FF` | `#9CCBFF` | clearer, brighter active icon/text |
| `inactive` | `rgba(110, 176, 255, 0.42)` | `rgba(178, 200, 230, 0.64)` | readable muted slate — secondary but not disabled-looking |

### 2. `src/navigation/MainTabNavigator.tsx` — web frosted glass
- Added a typed `TAB_BAR_WEB_GLASS` const applying `backdrop-filter: blur(18px) saturate(135%)`
  (web only) to the **bottom** tab bar via the existing `tabBarStyle` array.
- Native ignores the property; opaque role chromes show no visible blur, so it only frosts the
  translucent B2C (and Travel acrylic) bars.

## Behavior preservation
- No routes, screen registrations, labels, icons, or handlers changed.
- Layout, item count, sizing, dock clearance (`tabBarLift`, paddings, heights) unchanged.
- Active-pill grammar unchanged (bottom position still has no active background pill).
- Only style tokens + a web-only visual filter were touched.

## Out of scope (untouched)
HomeScreen, App.tsx, navigation/routes, payment/wallet/VIO, AI/SOS/backend/auth/db,
classifieds/feed/composer, merchant/B2B logic, image assets.
