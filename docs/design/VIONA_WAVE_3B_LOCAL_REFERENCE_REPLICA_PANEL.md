# VIONA Wave 3B — Local reference replica panel

**Status:** Archival reference/lab spec — **not integrated to production** on `master` (Pack 49). Described components remain workspace-only until Phase E integration.

## North star

Uploaded VIONA six-universe command-center image: contained universe panel, compact header (icon + universe title), four flagship premium tiles with semantic glow, vector micro-scenes, and CTA arrow orbs.

## Implementation

| Layer | Behavior |
|-------|----------|
| `LocalCommandCenterPanel` | Icon + universe title row, compact meta/trust, inset flagship tray, 12-node skyline SVG |
| `PremiumAppTile` `commandCenterFlagship` | 110–118px height, dark glass, bright border/rim, top accent, CTA circle, text-only header zone |
| `LocalVectorMicroScene` `replicaFlagship` | Richer hero staging for my-requests, booking, legal, community/discover |

## Flagship mapping

1. My requests — emerald  
2. Booking assist — cyan  
3. Legal & wealth — gold  
4. Discover services — violet (`local-community-events` scene, browse handler)

## Evidence

`docs/design/evidence/wave-3b-local-reference-replica-panel/` via `scripts/capture-local-reference-replica-panel.mjs`.

## Safety

Unchanged REQUEST-ONLY / NO CHARGE / CONFIRMED ≠ PAID copy and handlers.
