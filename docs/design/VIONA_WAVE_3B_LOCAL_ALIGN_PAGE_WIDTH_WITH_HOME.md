# VIONA Wave 3B — Align Local Page Width With Home

Task ID: `VIONA.WAVE_3B.LOCAL_ALIGN_PAGE_WIDTH_WITH_HOME.1`

## Goal

Align the Local page horizontal width/insets with Home so Local reads as the same premium
universe standard. On desktop/web, Local previously had noticeably wider left/right gutters,
making the content feel too narrow and less premium.

## Root cause of wider Local gutters

Home and Local use different shells:

- **Home** (`resolveFashionHomeDesktopLayout`, active for web B2C Home at width ≥ 769 via
  `isFashionHomeDesktopShell`) uses `shellWidth = windowWidth` — the **full viewport width**
  with only a modest edge inset (`12 / 16 / 24px` at `<960 / ≥960 / ≥1440`). No max-width cap.
- **Local** renders inside `PremiumAppShell`, whose content body is capped by
  `resolvePremiumShellContentRail`:
  - `maxWidth = contentMaxWidthDesktop (1200)` on the `desktop` tier (≥1280)
  - `maxWidth = contentMaxWidthLandscape (1080)` on the `landscapeTablet` tier (≥1024)
  - the body is `width: 100%`, `alignSelf: center`, **plus** `paddingHorizontal: horizontalPad`.

At 1366px the Local body became a 1200px box centered in the viewport → ~83px outer margin on
each side **plus** 16px inner padding ≈ **99px gutters**, versus Home's **16px**. The cap (not
the padding) was the difference: `PremiumAppShell` already uses the *same* `horizontalPad`
breakpoints as Home.

Because every Local section (top command rail, dynamic hero, the 4 hero cards, Local For You,
compact status strip, classifieds preview) lives inside that one capped body and is otherwise
`width: 100%`, the single cap drove the narrow rail for all of them.

## Fix

`src/screens/b2c/LocalScreen.tsx` only — pass a `contentStyle` override to `PremiumAppShell`
that lifts the `maxWidth` cap to `100%`, gated to **web desktop** via the existing `desktopWeb`
(`Platform.OS === 'web' && width > 768`) flag:

```tsx
contentStyle={desktopWeb ? styles.contentRailHomeParity : undefined}
// contentRailHomeParity: { maxWidth: '100%' }
```

`PremiumAppShell` composes the body as `style={[contentWrapStyle, contentStyle]}`, so the
override wins over the capped `maxWidth` while keeping `width: 100%` and the shell's existing
`paddingHorizontal`. Since that padding matches Home's edge inset exactly, Local now spans the
full viewport minus the same inset → visual width/inset parity with Home.

No change to `PremiumAppShell`, the shared rail tokens, `PremiumHubLayout`, the hero, hero
cards, or quick-actions components — they were already `width: 100%` and simply inherit the
wider rail.

## Width/inset alignment summary

| Viewport | Tier | Before (gutter each side) | After | Home reference |
| --- | --- | --- | --- | --- |
| 1366×768 | desktop (cap 1200) | ~99px | ~16px | full width, 16px |
| 1024×768 | landscapeTablet | ~32px (cap + double pad) | ~16px | full width, 16px |
| 768×1024 | tablet (no cap) | unchanged | unchanged | Home also boxed <769 |
| 390×844 | mobile (no cap) | unchanged | unchanged | Home also boxed <769 |
| 844×390 | landscapeTablet | tightened toward 16px | aligned | full width |

Gate: override applies only for `width > 768` on web; mobile, tablet-portrait, and all native
layouts are untouched.

## Preserved visual work

- Hero fit / aspect / crop, crisp frame, card rims — unchanged (components untouched).
- Local For You icon/text scale — unchanged.
- Continuous premium background shell — unchanged.
- Classifieds preview cap — unchanged.
- SOS hold-gate / navigation behavior — unchanged.

## Safety drift report

No IA, routes, handlers, payment/wallet/AI/SOS/backend/auth/classifieds/merchant logic changed.
Pure presentational width override in one screen, scoped to web desktop. Home implementation was
read-only reference. No horizontal overflow (`PremiumAppShell` root keeps `overflow: hidden`).

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/*` re-captured at `EXPO_CAPTURE_PORT=8093`
across 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Commit status

NOT COMMITTED.
