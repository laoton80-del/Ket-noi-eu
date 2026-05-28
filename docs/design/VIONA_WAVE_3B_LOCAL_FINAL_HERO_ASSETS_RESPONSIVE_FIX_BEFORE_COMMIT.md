# VIONA Wave 3B — Local final hero assets responsive fix before commit

**Pack:** `VIONA.WAVE_3B.LOCAL_FINAL_HERO_ASSETS_RESPONSIVE_FIX_BEFORE_COMMIT.1`
**Type:** Responsive stabilization (no IA/route/handler logic changes)

## Root cause

- The Local web shell used a tablet breakout style at `width >= VIONA_TABLET_MIN_WIDTH`.
- That breakout forced `100vw` plus negative side margins, which can create left clipping on tablet portrait (`768x1024`) depending on browser viewport + safe-area behavior.
- Result: header and hero copy looked cut on the left in capture output.

## Changes

- `src/screens/b2c/LocalScreen.tsx`
  - Restrict web breakout behavior to larger desktop widths (`>= 1200`) so tablet portrait remains in normal centered flow.
  - Slightly increase `PremiumAppShell` bottom clearance for:
    - mobile
    - short landscape heights
    - hub-wide layouts
  - Add `hubScrollTailLandscape` spacing for low-height landscape viewport docking comfort.
- `src/components/viona/local/LocalDynamicHero.tsx`
  - Reduce compact/short-viewport hero minimum height from `220` to `204` to avoid vertical crowding on `844x390` while preserving readability.

## Safety

- No changes to Local IA, routes, handlers, business logic, wallet/payment flows, AI/SOS/backend/auth, classifieds logic, or merchant logic.
- Hero/card asset mapping remains registry-driven and unchanged.
