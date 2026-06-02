# VIONA.WAVE_3B.TRAVEL_DYNAMIC_HERO_TITLE_AND_CARD_SEMANTIC_LIGHTING_SYNC.1

## Goal
Fix Travel dynamic hero typography authority and synchronize hero light-network colors with active/hovered Travel card semantics.

## Local vs Travel title audit (before)
| Token | Local | Travel (before) |
|-------|-------|-----------------|
| Kicker | 11px semibold, ls 2, emerald tint | 11px semibold, ls 2, cyan tint + glow |
| Title desktop | 26/32 extrabold, #FFF, no glow | 26/32 extrabold, dark depth shadow only |
| Title narrow | 22/28 | 22/28 |
| Subtitle | 14/21 medium | 14/21 (desktop) but base style 11/16 |
| Text veil | lighter copy column | heavy left midnight veil (74% width) |
| Network | emerald-led | cyan primary locked; hover secondary only |

**Why Travel felt weaker:** Same px title as Local but under a heavier text veil; prior parity pass removed cyan title glow; network stayed cyan-only on hover so cards and hero felt disconnected.

## Typography changes (after)
| Band | Size / LH | Notes |
|------|-----------|-------|
| Desktop | 30/36 (+2 fs/lh fullscreen) | +4px vs Local for midnight-stack authority |
| Tablet | 28/34 | |
| Narrow | 24/30 | |
| Compact | 22/28 | |
| Title shadow | radius 18, rgba(3,6,12,0.62) | Controlled depth, letterSpacing -0.2 |

Copy unchanged: TRAVEL LITE kicker, companion headline, subtitle, trust chips.

## Semantic lighting map
| Card semantic | Network primary | Network secondary | Rule |
|---------------|-----------------|-------------------|------|
| Default | `#84EEFF` cyan | `#66B6FF` sky | Cyan route-light baseline |
| Airport / taxi / transit | cyan | sky-blue | Full cyan boost |
| Translation | `#9AD4FF` violet-cyan blend | violet ink | Cyan still in arcs/wash |
| Emergency | cyan base | magenta accent | No full magenta takeover |
| Emerald (local/restaurant/hospital) | emerald | cyan | Emerald-cyan |
| Gold (hotel/business) | cyan base | gold ink | Gold subtle only |

All layers synced: `textSafeWash`, `bottomHandoff`, route arcs, edge bloom, subject glow, `LocalLightingNetworkEdge`, `LocalHeroNetworkPulse`.

## Hover behavior
Existing UI-only state in `TravelScreen`:
- `travelCardHoverAccent` from flagship hover + utility hover
- `activeTravelHeroKey` / `activeTravelHeroFrameAccent` for dynamic hero image
- `travelHeroFrameLit` gates boosted lighting
- Leave handlers reset to cyan baseline

## Artifacts removed
- Subject glow wired to resolver (no hard cyan scanline at 0.08 opacity)
- Baseline subject glow softened to 0.045
- Network primary now follows semantic accent when boosted

## Evidence
`docs/design/evidence/wave-3b-travel-dynamic-hero-title-and-card-semantic-lighting-sync/`

Capture: `node scripts/capture-travel-dynamic-hero-title-and-card-semantic-lighting-sync.mjs`
