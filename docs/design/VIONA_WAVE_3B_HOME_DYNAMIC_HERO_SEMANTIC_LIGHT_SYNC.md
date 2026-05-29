# VIONA Wave 3B — Home Dynamic Hero Semantic Light Sync

**Task:** `VIONA.WAVE_3B.HOME_DYNAMIC_HERO_SEMANTIC_LIGHT_SYNC.1`

## Problem

Home desktop hero light-network hover was visually correct but used a single gold/cyan palette for all world-card hover states. Dynamic hero images swapped per card, but network pulse and rim stayed constellation-gold.

## Solution

Drive hero network edge, pulse, hover rim, and subtle inner frame tint from `desktopLivingCopyKey` (`livingOverlayKey ?? livingBaseKey`) via `getHomeHeroSemanticLighting()`.

## Semantic mapping

| Active world | Primary | Secondary |
|--------------|---------|-----------|
| default | gold (`accentGold`) | cyan (`accentCyan`) |
| local | emerald (`accentEmerald`) | cyan |
| travel | cyan | blue (`#66B6FF`) |
| academy | violet (`accentViolet`) | magenta (`accentMagenta`) |
| business | gold | amber (`#F0B35D`) |

## Preserved

- 240ms `heroHoverAnim` timing and easing
- Reduced-motion path unchanged
- World card hover handlers and living hero crossfade
- Hero layout, images, IA, routes, SOS gate

## Files

- `src/components/viona/homeHeroSemanticLighting.ts` — mapping + web transition helpers
- `src/screens/HomeScreen.tsx` — wires semantic accents to network/rim/frame tint

## Evidence

`docs/design/evidence/wave-3b-home-dynamic-hero-semantic-light-sync/`
