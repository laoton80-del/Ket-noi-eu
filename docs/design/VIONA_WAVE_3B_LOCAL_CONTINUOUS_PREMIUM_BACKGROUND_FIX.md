# VIONA Wave 3B — Local continuous premium background fix

**Task:** `VIONA.WAVE_3B.LOCAL_CONTINUOUS_PREMIUM_BACKGROUND_FIX.1`
**Scope:** `src/screens/b2c/LocalScreen.tsx` only (no IA, routes, handlers, hero/card images,
payment/AI/SOS/classifieds/merchant logic, or Home changes).

## 1. Root cause of the background split

The Local page was layering **multiple competing background sources**, producing a visible
horizontal seam between the hero/cards band and the lower Local For You / Classifieds band:

1. **Shared shell full-page photo** — `PremiumAppShell` was invoked with
   `enableLuminousBackground` + `backgroundUniverse="local"`, which paints the Local city
   photo (`viona-local-bg-main-*.png`) across the whole page plus a **hard-edged
   `ambientWash`** that stops abruptly at 38% height. That hard edge + photo read as a
   separate "scene" behind the upper area.
2. **Legacy night-theme veils** — `LocalScreen` still rendered three leftover decorative
   layers (`canvasBackdropVeil`, `canvasGlow`, `contentFieldVeil`) anchored to `bottom: 0`
   with a `canvasBackdropTopBleed` offset — a second set of gradients fighting the premium
   backdrop.
3. **Warm radial ended mid-page** — the premium backdrop's warm glow faded out around
   ~52% of the viewport, creating a perceptible warm→navy band roughly where the hero/cards
   met the lower sections.

Together these stitched two tonal zones, so the page did not read as one continuous shell.

## 2. Files changed
- `src/screens/b2c/LocalScreen.tsx`
- `docs/design/VIONA_WAVE_3B_LOCAL_CONTINUOUS_PREMIUM_BACKGROUND_FIX.md` (this doc)
- `docs/design/evidence/wave-3b-local-final-hero-assets/*.png` (regenerated capture evidence)

## 3. Background shell fix summary

One continuous Local-only premium shell, no photo, no seam:

- **Removed the shared shell full-page photo**: dropped `enableLuminousBackground` and
  `backgroundUniverse="local"` from the Local `PremiumAppShell`. No city/background image is
  painted anymore (upper or lower), and the hard `ambientWash` edge no longer competes (it is
  fully occluded by the opaque premium backdrop).
- **Removed the legacy night veils**: deleted `canvasBackdropVeil`, `canvasGlow`,
  `contentFieldVeil` (JSX + styles) and the now-unused `canvasBackdropTopBleed` /
  `useSafeAreaInsets`. The Local root now has exactly one background source.
- **Single continuous premium backdrop** (`LocalPremiumShellBackdrop`, viewport-fixed on web
  so it stays put while scrolling — identical at every scroll position, no content-relative
  seam):
  - **Base**: smooth vertical gradient `#11222C` (deep navy, faint top lift) → `#0A1622`
    (deep navy) → `#06130F` (emerald-black), locations `[0, 0.55, 1]`.
  - **Warm glow**: a single very soft, large, low-alpha radial near **top/right**
    (`150% 105% at 74% -22%`, ~0.10 → 0 by 68%) so the warmth dissolves gradually with no
    visible band edge.
  - **Network**: a low-opacity emerald→transparent→cyan diagonal aurora
    (`0.06` / `0.045`) for subtle depth.
- **Web page canvas** stays painted with the deep base (`#0A1622`) on `html`/`body` with
  `overflow-x: hidden`, so there are no white gutters and no horizontal overflow.

Result: deep emerald-black/navy premium field, subtle cyan/emerald network, soft warm light
near the top, and **no perceptible horizontal seam** between hero/cards and the lower page.

## 4. Preserved (unchanged)
- Hero image fit + crisp hero frame.
- The four hero-card borders/rims.
- Local For You pill scale.
- Classifieds preview behavior.
- No white gutters / no horizontal overflow.
- Navigation untouched (the removed background layers were not attached to any nav wrapper;
  the prior floating-dock dedup remains as shipped).

## Acceptance
- No visible horizontal background seam; background is continuous, premium, and not flat teal.
- Hero/card images remain the visual focus; text and lower sections stay readable.
- No white gutters, no horizontal overflow, across 390×844 / 768×1024 / 844×390 / 1024×768 /
  1366×768.
- No route/handler/business-logic drift.
