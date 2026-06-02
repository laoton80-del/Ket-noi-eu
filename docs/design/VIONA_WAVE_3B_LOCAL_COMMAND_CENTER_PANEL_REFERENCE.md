# VIONA Wave 3B — Local command-center panel reference

**Status:** Archival reference/lab spec — **not integrated to production** on `master` (Pack 49). Panel/tile behavior below is design intent for future integration, not shipped runtime.

## Intent

Align Local hub with the six-universe **command-center** reference: each universe is a **contained luminous panel** with its own header, code-drawn backdrop, and **compact flagship tiles** (not full-width poster rows).

## Structure

1. **`LocalCommandCenterPanel`** — emerald/cyan universe shell, SVG skyline/grid backdrop, localized header + safety chips.
2. **Flagship grid (inside panel)** — 2×2 mobile / 4-across desktop:
   - My requests (emerald)
   - Send booking assist (cyan)
   - Legal & wealth (gold)
   - Browse / discover Vietnamese services (violet)
3. **Secondary sections (below panel)** — unchanged handlers: restaurant, transit, nails, events, housing, classifieds, capabilities, connected universes, classifieds feed, quick-help strip, compact status guide.

## Visual law

- Panel border + inner rim + corner wash; no baked image text.
- Flagship tiles use `commandCenterFlagship` on `PremiumAppTile` for brighter compact reference rims.
- Vector micro-scenes in lower half; semantic accents per card meaning.
- Safety copy unchanged: REQUEST-ONLY, NO CHARGE, CONFIRMED ≠ PAID.

## Final polish (panel cohesion)

- Tighter header rhythm; flagship tiles sit in an inset **tray** inside the panel shell.
- Richer code SVG backdrop: horizon glow, mesh arcs, 12 luminous nodes.
- `commandCenterFlagship` tiles use ~120–128px min-heights, `primary` vector scale, integrated scene wash.

## Evidence

- Initial: `docs/design/evidence/wave-3b-local-command-center-panel/` — `scripts/capture-local-command-center-panel.mjs`
- Final polish: `docs/design/evidence/wave-3b-local-command-center-panel-final-polish/` — `scripts/capture-local-command-center-panel-final-polish.mjs`

## Allowed touch surface

- `LocalScreen.tsx`, `LocalCommandCenterPanel.tsx`, small `PremiumAppTile` panel variant, optional `LocalVectorMicroScene` tuning only.
