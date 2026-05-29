# VIONA Wave 3B — Local Dynamic Hero Height Fine-Tune

Task ID: `VIONA.WAVE_3B.LOCAL_DYNAMIC_HERO_HEIGHT_FINE_TUNE.1`

## Goal

Slightly increase the Local dynamic hero visual height so the banner reads as a more
premium cinematic strip on desktop/web, without reintroducing the over-zoom / over-crop
that the prior "true fit" pass removed.

## Problem

After the true-fit pass the hero image fits correctly, but the frame felt slightly too
shallow on desktop/web. The frame height is width-driven (via `aspectRatio`), so on the
1200px desktop content cap the banner resolved to ~390px — below the max cap — leaving the
banner a touch short.

## Approach

`src/components/viona/local/LocalDynamicHero.tsx` only:

- Nudged the **frame** aspect ratio a hair taller — `1600 / 520` → `1600 / 548`. The
  delivered daylight assets remain 1600×520 and continue to fill via `cover`, so the image
  still sits inside the frame; the extra height adds only a minimal, even crop (~2.7% per
  side). No `transform: scale`, no negative inset.
- Raised the `minHeight` floors so mobile / tablet-portrait (which are floor-governed)
  also grow:
  - default (tablet portrait / non-narrow): `248 → 262`
  - narrow (mobile portrait, width < 520): `212 → 222`
  - compact (short / wide-landscape viewports): `184 → 192`
- Raised the `maxHeight` caps for headroom: `440 → 464` (default), `300 → 312` (compact).

This keeps the responsive width-driven `aspectRatio` behavior intact while delivering the
requested per-breakpoint increase.

## Measured height deltas (effective frame height)

| Viewport | Before | After | Δ |
| --- | --- | --- | --- |
| Desktop (1366 → 1200px content cap) | ~390 | ~411 | +21 |
| Desktop low end (1024 → ~992px) | ~322 | ~340 | +18 |
| Landscape tablet (~1080px) | ~351 | ~370 | +19 |
| Tablet portrait (768) | 248 (floor) | 262 (floor) | +14 |
| Mobile portrait (390) | 212 (floor) | 222 (floor) | +10 |
| Compact landscape (844×390) | ~266 | ~281 | +15 |

All within the requested bands (desktop/web ≈ +20–28, tablet ≈ +12–18, mobile ≈ +8–12).

## Constraints honored

- No image replacement, no IA change.
- No routes / handlers / payment / AI / SOS / backend change.
- `aspectRatio` width-driven behavior preserved (no fixed pixel height).
- No scale transform, no negative inset.
- Image stays inside the frame (`cover`); text readability preserved.
- No horizontal overflow; bottom dock clearance unaffected (hero sits at top of scroll).

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/*` re-captured at
`EXPO_CAPTURE_PORT=8093` across 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Commit status

NOT COMMITTED.
