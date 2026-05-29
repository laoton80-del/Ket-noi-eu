# VIONA Wave 3B — Local For You: final optical-center lock

Tiny pre-commit polish. Local For You pills read slightly **left-heavy** even though the icon+label
lockup is already geometrically centered. This pack adds a measured **optical** nudge so the lockup
feels balanced inside each wide pill. No IA / routes / handlers / action-list changes; no new
lighting effects; nothing outside `LocalQuickActionsRow.tsx` touched.

## Root cause of the remaining imbalance

The lockup was already geometrically centered (measured cluster-center vs pill-center offset = `0px`
at all viewports). The lingering left-heavy read is **optical, not geometric**: the leading icon is a
dense, bright filled capsule that anchors the eye, and on wide desktop pills (4-column rail, ~300px
pills holding a ~115px lockup) the symmetric empty space exaggerates that anchor. Geometric centering
leaves the icon's visual mass well to the left of the pill's true center.

A fixed pixel nudge can't solve this safely: it would crowd the snug mobile/tablet pills (where the
lockup already fills the pill) while being too small to matter on wide desktop pills.

## Final centering fix

`LocalQuickActionsRow.tsx` — the lockup keeps its existing structure (single self-sizing content
group, no `flexGrow`, label `flexShrink: 1` + `minWidth: 0`, max 2 lines, `textAlign: 'center'`).
Added a **measured, per-pill optical shift**:

- `onLayout` captures the pill width and the content (lockup) width.
- `sideMargin = (pillWidth - 2·paddingH - contentWidth) / 2`.
- `opticalShift = clamp(0, OPTICAL_SHIFT_MAX=18, sideMargin - MIN_SIDE_BREATHING=12)`.
- The shift is applied as `transform: translateX(opticalShift)` on the content group (no layout
  reflow, no wrapping change, no overflow).

Effect: the icon's visual mass moves up to ~half the icon+gap width toward the pill's true center.
Snug pills (small `sideMargin`) resolve to `0` and are left exactly as they were; the right margin
can never fall below `MIN_SIDE_BREATHING`, so breathing room stays balanced and nothing overflows.

Font size, icon size, pill height, gap, padding, and the responsive grid are unchanged.

### Measured result (icon→label ink centroid offset from pill center, px)

| viewport | shift behavior |
|---|---|
| 1366×768 | +18 on all 8 pills (right margin stays ≥ 50) |
| 1024×768 | +2…+18 depending on label width (graceful) |
| 768×1024 | 0 on full pills, +10 only for the shortest label; right margin ≥ 15 |
| 844×390  | 0…+18, right margin ≥ 26 |
| 390×844  | 0 on full pills, +7 for shortest label; right margin ≥ 20 |

No pill drops below ~15px right margin → no crowding, no horizontal overflow.

## Handler preservation

All 8 actions and their handlers are untouched: Restaurant, VIONA Transit, Rentals & housing,
Classifieds, Nails & Spa, Community events, AI Receptionist, Language assist.

## Safety

Only `LocalQuickActionsRow.tsx` changed (plus this doc + evidence). No hero, classifieds, secondary
cards, background, SOS, payment/wallet, AI, backend/auth, or merchant logic touched. No new
lighting/network effects. No routes/IA/business-logic drift.
