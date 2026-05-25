# VIONA Wave 3B — Local Card Hierarchy Layout

**Pack:** `VIONA.WAVE_3B.UNIVERSE_CARD_HIERARCHY_LAYOUT.1`
**Status:** **COMMITTED** — layout-only
**Baseline:** `5d68179` — luminous background registry
**Date (UTC):** 2026-05-25

---

## Goal

Reorder and resize Local hub card groups so the screen reads as one premium luminous universe panel (command-center quality), not an equal-weight debug grid.

## Layout hierarchy (top → bottom)

| Tier | Surface | Implementation |
|------|---------|----------------|
| 1 | Universe header / trust strip | `PremiumHubLayout` hero — title, headline, compact trust line, `PremiumStatusChip` safety row |
| 2 | Hero action area | `size="hero"` tiles — Browse services + Send booking assist (same handlers as before) |
| 3 | Primary tile grid (4) | Restaurant, Transit, Legal & wealth, My requests — 2-col mobile, 4-col desktop |
| 4 | Quick help strip | Slim pressable row → same booking-assist Leona prefill |
| 5 | Compact status guide | Text + icon legend rows (replaces full-size legend tiles) |
| 6 | Secondary services | Nails, events, housing, classifieds, legal scanner |
| 7 | Capabilities + connected universes | Lower opacity section wrappers |
| 8 | Classifieds | Unchanged anchor + composer |

## Preserved actions

All `onPress` / `navigation.navigate` targets from the prior hub layout are retained. Items moved between tiers only; nothing removed.

## Evidence

`docs/design/evidence/wave-3b-local-card-hierarchy/` — capture via `node scripts/capture-local-card-hierarchy.mjs` (Expo web `:8088`, intent dismissed).

## Out of scope

- Card micro-scene asset changes
- Travel / other universe background wiring
- i18n copy changes
- Payment / request / route logic
