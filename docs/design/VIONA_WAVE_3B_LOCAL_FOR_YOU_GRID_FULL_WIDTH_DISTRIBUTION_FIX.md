# VIONA Wave 3B — Local For You: grid full-width distribution fix

The Local For You panel left a large empty area on its right side: the 8-pill grid did not occupy the
full panel width, so every pill read as pushed left even though each pill's internal content is
centered. This fixes the grid distribution. Only `LocalQuickActionsRow.tsx` changes; no IA, routes,
handlers, action list, or other surfaces touched; no new effects.

## 1. Root cause of the right-side empty area

The grid is a `flexWrap: 'wrap'` row, and each column cell used a **fixed percentage width** with
`flexGrow: 0`:

```
cell4: { width: '23.2%' }   // 4 × 23.2% = 92.8%  → ~7% unused
cell8: { width: '10.7%' }   // 8 × 10.7% = 85.6%  → ~14% unused
```

With no `justifyContent` (default `flex-start`) the row packed the under-width columns to the left and
left the remainder as dead space on the right edge of the panel. So the whole grid looked
left-clustered regardless of per-pill internal centering.

## 2. Files changed

- `src/components/viona/local/LocalQuickActionsRow.tsx`
- `docs/design/VIONA_WAVE_3B_LOCAL_FOR_YOU_GRID_FULL_WIDTH_DISTRIBUTION_FIX.md` (this doc)
- `docs/design/evidence/wave-3b-local-final-hero-assets/*` (regenerated hero + For You grid captures)

## 3. Grid full-width distribution fix

The grid container is already `width: '100%'`. The cells switched from fixed width / `flexGrow: 0`
to a **flexBasis + grow** model:

- `gridCell`: `flexGrow: 1, flexShrink: 1, minWidth: 0`.
- per-column `flexBasis` kept **under** `100/columns %` so exactly `columns` items fit per row and the
  next one wraps: `cell2: 46%`, `cell3: 30%`, `cell4: 22%`, `cell8: 11%`.

`flexGrow: 1` then expands the columns to absorb the leftover width **and the inter-column gaps**, so
each row spans the full panel from the left padding edge to the right padding edge. The existing
ghost padding cells (same `gridCell` style) keep partial last rows column-aligned.

### Measured result (grid element)

| viewport | cols | left gap | right gap | row span / grid width |
|---|---|---|---|---|
| 1366×768 | 4 | 0px | 0px | 1308 / 1308 |
| 1024×768 | 4 | 0px | 0px | 966 / 966 |
| 768×1024 | 4 | 0px | 0px | 694 / 694 |
| 390×844  | 2 | 0px | 0px | 316 / 316 |

First column aligns with the panel's left padding, last column with the right padding; no dead space.

## 4. Pill internal layout preservation

The per-pill internal layout from the previous pack is unchanged: wide pills (roomy 4-column desktop,
`1024 ≤ width < 1480`) use the deterministic three-zone grid (icon zone | centered label zone | equal
spacer zone); narrower columns use the snug centered icon+label group. Pills are now wider (full
distribution), which the centered-label grid handles cleanly. Not reverted to left-aligned. No
font/icon shrink, pill height unchanged, max 2-line labels, no overflow.

## 5. Handler preservation

All 8 actions/handlers unchanged: Restaurant, VIONA Transit, Rentals & housing, Classifieds,
Nails & Spa, Community events, AI Receptionist, Language assist.

## 6. Safety

Only `LocalQuickActionsRow.tsx` changed (plus this doc + evidence). `LocalScreen.tsx` was not touched
— the panel was already full width; the root cause was the cell width math. No hero, classifieds,
secondary cards, background, SOS, payment/wallet, AI, backend/auth, or merchant logic touched. No new
effects. No route/IA/business-logic drift.
