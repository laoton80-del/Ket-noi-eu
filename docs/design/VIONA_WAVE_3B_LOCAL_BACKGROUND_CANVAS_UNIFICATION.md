# VIONA Wave 3B — Local Background Canvas Unification

Task ID: `VIONA.WAVE_3B.LOCAL_BACKGROUND_CANVAS_UNIFICATION.1`

## Goal

Make the Local page background one continuous premium canvas top-to-bottom, removing the
visible "two-color split" that appeared around and below "Local cho bạn" (Local For You).

## Root cause of the split background

The Local premium gradient lives in `LocalPremiumShellBackdrop`, rendered inside the
`PremiumAppShell` scroll content. On web it was positioned `position: fixed` (inset 0), so it
only ever covered the **first viewport**:

- In a full-page render (and the QA captures), a `position: fixed` layer paints once at the top
  and does **not** extend below the first viewport height.
- Everything below the fold therefore fell back to the page's base canvas (the shell's dark
  base / the forced capture canvas `#050B14`), which is darker than the premium gradient.

The first-viewport fold lands right around the "Local cho bạn" / request / classifieds region,
so the page looked cut into an upper premium-teal band and a lower darker navy/black slab.

This was a **background-layer** problem, not a content-slab problem — the section wrappers were
audited and are already transparent or light glass (see below).

## What was changed to unify the canvas

`src/screens/b2c/LocalScreen.tsx` only — `LocalPremiumShellBackdrop` styles:

1. `premiumBackdrop` (web): `position: fixed` → `position: absolute` with `top: 0; bottom: 0`
   and a horizontal bleed (`left: -40; right: -40`). It now fills the **full scroll content
   height** (one gradient runs top-to-bottom, no seam) and the bleed lets it reach the viewport
   edges even when the content rail is narrower than the window (clipped by the shell's
   `overflowX: hidden`, so no horizontal scroll / no gutters). Native keeps `absoluteFillObject`
   (it already spanned the full content — native never showed the seam).
2. `premiumWarmGlowWeb`: anchored to a fixed-height top band (`top: 0; height: 760`) instead of
   filling the layer, so the golden-hour glow stays near the hero/top and does not wash down the
   now full-height backdrop.

The opaque base gradient (`#11222C → #0A1622 → #06130F`) plus the subtle emerald/cyan aurora now
span the entire page as a single cohesive midnight-teal canvas, with the warm glow near the hero.

## Sections audited for stray background slabs

| Section | Background | Verdict |
| --- | --- | --- |
| `LocalScreen` root / `container` | premium canvas color | owns the base — OK |
| `premiumContentLift` | transparent (`zIndex: 1`) | OK |
| `shellRailWrap` (top command rail) | gradient rail (intentional glass) | OK |
| `LocalOpeningStageLayout` root | transparent | OK |
| `LocalDynamicHero` | own dark-glass frame (intentional) | OK |
| Compact status strip | `rgba(8,14,26,0.32)` translucent glass | OK |
| `LocalQuickActionsRow` (Local For You) | `VionaGlassPanel` `rgba(8,12,20,0.28)` glass | OK |
| `LocalClassifiedsFeaturedPreview` wrap | transparent | OK |
| Merchant tools / connected universes sections | transparent (opacity only) | OK |

No opaque mid-page slab existed; the only fix needed was the fixed → full-height backdrop.

## Preserved

Daylight hero image, 4 Local opening cards, button hierarchy, Local cho bạn pills, classifieds
preview logic, request-only / no-payment safety copy, B2C/B2B separation, hero frame, card
shells, and floating / bottom navigation are all unchanged.

## Safety drift report

No IA, routes, handlers, payment/wallet/AI/SOS/backend/auth/classifieds/merchant logic changed.
Home untouched. Pure presentational background-layer positioning change in one Local screen. No
horizontal overflow; no white gutters.

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/*` re-captured at `EXPO_CAPTURE_PORT=8093`
across 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Commit status

NOT COMMITTED.
