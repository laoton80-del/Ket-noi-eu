# VIONA Wave 3B — Local For You: pill internal-grid balance

Replaces the natural-group / measured-nudge centering of the Local For You pills with a
**deterministic internal grid** so wide pills feel balanced: the readable label is centered and the
leading icon no longer drags the content left. Only `LocalQuickActionsRow.tsx` changes; no IA,
routes, handlers, action list, or other surfaces touched; no new lighting effects.

## 1. Why previous centering failed

Earlier passes centered the icon+label as a single natural-width group (`justifyContent: 'center'`),
then added a measured optical translateX nudge. The group was mathematically centered (offset 0px),
but it still *read* left-heavy on wide pills: the icon is a dense, bright filled capsule, so a lockup
that places it at the group's left edge puts the visual weight left of the pill's true center. The
nudge could only shift a few px before crowding snug pills, so it couldn't meaningfully rebalance the
wide desktop pills. The label position was coupled to the icon, so the icon always pulled the
readable content left.

## 2. Files changed

- `src/components/viona/local/LocalQuickActionsRow.tsx`
- `docs/design/VIONA_WAVE_3B_LOCAL_FOR_YOU_PILL_INTERNAL_GRID_BALANCE.md` (this doc)
- `docs/design/evidence/wave-3b-local-final-hero-assets/*` (regenerated hero + For You grid captures)

## 3. Internal grid / balance solution

On wide pills the pill content is a fixed three-zone flex row:

```
[ icon zone (W) ][ label zone (flex:1, textAlign center) ][ spacer zone (W) ]
```

- `iconZone` and `spacerZone` are the **same fixed width** (`ICON_ZONE = 29`, the icon capsule
  width), with symmetric `gap: 8`. Equal side zones + symmetric gaps make the **label zone
  mathematically centered in the pill**, independent of label length.
- The label fills the middle zone (`flex: 1`) and **centers its own text** (`textAlign: 'center'`),
  so the readable content sits at the pill's true center and the right side is no longer empty.
- The icon lives in its own left zone (left-aligned, vertically centered) — a leading accent that
  can no longer move the label.
- Long labels wrap to **max 2 lines** centered; no font/icon shrink; pill height unchanged; no
  horizontal overflow.

## 4. Responsive fallback

The three-zone grid is used only where pills are genuinely wide — the roomy 4-column desktop range
`1024 ≤ width < 1480`. Outside that:

- `< 1024` (tablet-portrait/mobile 4/3/2 columns) and `≥ 1480` (8 narrow columns) fall back to the
  snug **centered icon+label group**, which already fills those small pills. This is intentional:
  fixed side zones on a ~160px pill would starve the label and clip long single-word labels like
  "Receptionist". The fallback wraps cleanly with no overflow.

Verified: 1366 & 1024 → centered labels with icon as a left accent; 768 & 390 → snug centered group;
no overflow at any viewport.

## 5. Handler preservation

All 8 actions/handlers unchanged: Restaurant, VIONA Transit, Rentals & housing, Classifieds,
Nails & Spa, Community events, AI Receptionist, Language assist. Only the pill's internal layout
markup/styles changed; props and `onPress` wiring are identical.

## 6. Safety

Only `LocalQuickActionsRow.tsx` changed (plus this doc + evidence). No hero, classifieds, secondary
cards, background, SOS, payment/wallet, AI, backend/auth, or merchant logic touched. No new
lighting/network effects. No route/IA/business-logic drift.
