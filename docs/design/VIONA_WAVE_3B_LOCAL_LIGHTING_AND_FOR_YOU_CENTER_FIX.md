# VIONA Wave 3B — Local: Lighting (all hero states) + For You pill centering fix

Closes two unfinished items from the Local premium lighting/motion system:

1. **Local For You** pills read left-heavy.
2. **Dynamic hero** network pulse / lighting only animated for the **default** hero.

No new product features, no IA / route / handler / image / business-logic changes.

---

## A. Local For You pill centering

### Root cause

The icon + label were two direct flex children of the pill. The pill already had
`justifyContent: 'center'`, so the cluster was in fact **geometrically centered** — measured
cluster-center-vs-pill-center offset was `0px` at 1366 / 768 / 390. The lingering "left-heavy"
read came from two things, not a layout bug:

- the **leading icon capsule** is a dense, bright filled disc, so the eye anchors on it and reads
  the (correctly centered) lockup as biased left, especially on **wide desktop pills** with lots of
  symmetric empty space; and
- short labels (e.g. `Inzerce`) leave large equal margins, amplifying that impression.

### Fix

`LocalQuickActionsRow.tsx`:

- Icon + label are now wrapped in a single self-sizing **content lockup** (`styles.content`):
  `flexDirection: row`, `alignItems/justifyContent: center`, `alignSelf: center`, **no flexGrow**,
  `minWidth: 0`, `maxWidth: '100%'`. The pill centers this one lockup as a unit instead of letting
  the label stretch the row.
- `label` keeps `flexShrink: 1` + `minWidth: 0` (so Vietnamese/Czech labels wrap to **max 2 lines**
  with no overflow, no font shrink, no icon shrink) and now uses `textAlign: 'center'`, so wrapped
  2-line labels stack centered (`VIONA / Transit`) instead of ragged-left.
- Pill horizontal padding trimmed `18 → 14` and the icon↔label gap `11 → 10` to tighten the lockup.
- Height (`minHeight`), the responsive column grid, and all 8 handlers are unchanged.

### Result (measured)

Cluster offset from pill center = **0px** on every column at 1366 / 768 / 390. At 768 / 390 the
snug pills + centered 2-line labels make the centering visually unmistakable; at 1366 the lockup is
dead-centered with balanced breathing room on both sides.

---

## B. Dynamic hero lighting for all hero states

### Root cause

The hero pulse + network boost + rim were gated **only** on the hero's own hover
(`active={hovered && supportsHover}`). But the active hero state (`activeHeroKey`) is driven by
hovering one of the **four hero cards** (`onHeroCardHover` → `setActiveHeroKey`), and you cannot hover
a card and the hero frame at the same time:

- hovering the hero frame → `hovered = true` but `activeHeroKey` stays `default` → pulse runs, but
  always in the **default emerald** accent;
- hovering a card → image + `visual.accent` swap, but `hovered = false` → **no pulse at all**.

Net effect: the pulse appeared to "only work for the default hero".

The semantic accent map already existed and was correct
(`vionaLocalHeroVisuals.ts`: default/myRequests = emerald/cyan, bookingAssist = cyan/blue,
legalWealth = gold/amber, browseServices = violet/magenta), so **no metadata changes were needed** —
the accents were simply never lit.

### Fix

`LocalDynamicHero.tsx` introduces a single derived "lit" state:

```
const cardActive = activeHeroKey !== 'default';
const heroLit = (hovered || cardActive) && supportsHover;
```

`heroLit` now drives the hover wash + rim (`hoverAnim`), the `LocalLightingNetworkEdge` `boosted`
flag, and the `LocalHeroNetworkPulse` `active` flag. Because the edge/pulse already consume
`visual.accent` / `visual.secondaryAccent` (which follow `activeHeroKey`), the lit network +
traveling pulse + rim now appear in **each state's own semantic accent**, whether the user hovers the
hero directly or hovers a card that swaps the hero.

### Hover / theme / reduced-motion

- Hover hero directly → default pulse (emerald/cyan).
- Hover any of the 4 cards → hero crossfades and the pulse/network/rim follow the new accent; moving
  between cards re-tints live; hover-out fades back smoothly via the existing 240 ms `hoverAnim`.
- Gated by `supportsHover` (`hover: hover` + `pointer: fine`) so touch stays static.
- `LocalHeroNetworkPulse` returns `null` under reduced motion (unchanged).
- Theme-invariant premium glass shell unchanged; no image zoom/crop/layout regression.

---

## Files changed

- `src/components/viona/local/LocalQuickActionsRow.tsx` — centered content lockup, centered 2-line
  labels, tighter padding/gap.
- `src/components/viona/local/LocalDynamicHero.tsx` — `heroLit` drives boost + pulse + rim for all
  hero states.
- `docs/design/VIONA_WAVE_3B_LOCAL_LIGHTING_AND_FOR_YOU_CENTER_FIX.md` — this doc.
- `docs/design/evidence/wave-3b-local-final-hero-assets/` — per-state hero captures
  (`hero-state-*.png`) + For You grid captures (`for-you-grid-*.png`).

`src/design/vionaLocalHeroVisuals.ts` was **not** modified (accent map already correct).

## Safety

No routes, handlers, IA, images, payment/wallet/VIO, AI, SOS, backend/auth, classifieds, or merchant
logic touched. Local-only visual/motion tuning.
