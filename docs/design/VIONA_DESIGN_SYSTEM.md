# VIONA Design System — hybrid source

Additive source for later UI packs. Existing screens and existing token files stay on their current imports. This pack does not switch light and dark at runtime.

Import the new source from `src/design/system`. Do not rewire `src/theme/*` or `src/design/index.ts` in this pack.

One hybrid set:

- Dark shell: `backgroundShell` `#121212`, `surfaceShell` `#1A1A24`. These are charcoal, not pure black.
- Light cards on that shell: `surfaceCard` `#EDF1F7`, `surfaceCardAlt` `#FFFFFF`.
- Brand gold: `accentGold` `#C5A059`.
- Six universe accents. Business and Account both use gold because `premiumUniverseAccentByHub` already maps both hubs to gold. SOS uses the existing warning red `#E57373` (`theme.colors.danger`). The older tile law also maps SOS to magenta; this source follows the 2026-11-09 hybrid decision and does not copy that magenta.

## Files

| Path | Role |
| --- | --- |
| `src/design/system/tokens.ts` | Semantic constants |
| `src/design/system/types.ts` | `UniverseId`, `ShadowToken`, `TypeRole` |
| `src/design/system/index.ts` | Public export |
| `docs/design/VIONA_DESIGN_SYSTEM.md` | This map |

## Token table

| Token | Value |
| --- | --- |
| `color.backgroundShell` | `#121212` |
| `color.surfaceShell` | `#1A1A24` |
| `color.surfaceCard` | `#EDF1F7` |
| `color.surfaceCardAlt` | `#FFFFFF` |
| `color.divider` | `rgba(6, 18, 36, 0.1)` |
| `color.textOnDark` | `#F4F1EA` |
| `color.textMutedOnDark` | `rgba(244, 241, 234, 0.68)` |
| `color.textOnLight` | `#0B1628` |
| `color.textMutedOnLight` | `rgba(11, 22, 40, 0.58)` |
| `color.accentGold` | `#C5A059` |
| `color.universe.local` | `#14B8A6` |
| `color.universe.travel` | `#2563EB` |
| `color.universe.academy` | `#7C3AED` |
| `color.universe.business` | `#C5A059` |
| `color.universe.account` | `#C5A059` |
| `color.universe.sos` | `#E57373` |
| `typography.display` | Montserrat 800, 30 / 38 |
| `typography.title` | Montserrat 700, 22 / 30 |
| `typography.body` | Montserrat 400, 15 / 22 |
| `typography.caption` | Montserrat 400, 12 / 18 |
| `spacing` | 4, 8, 12, 16, 20, 24, 32 |
| `radius` | 10, 14, 18, 22, pill 999 |
| `elevation.cardOnShell` | y 8, opacity 0.25, radius 16, elevation 6, color `#000000` |
| `elevation.modal` | y 12, opacity 0.35, radius 20, elevation 12, color `#000000` |
| `zIndex` | base 0, card 1, sticky 10, overlay 20, modal 40 |

`zIndex` has no predecessor in `src/theme/theme.ts`. It is new in this source.

Font family strings match `src/theme/typography.ts`: 400 `Montserrat_400Regular`, 500 `Montserrat_500Medium`, 600 `Montserrat_600SemiBold`, 700 `Montserrat_700Bold`, 800 `Montserrat_800ExtraBold`.

## Old token to new token

| Existing | New |
| --- | --- |
| `hubCore.backgroundTop` `#121212` | `color.backgroundShell` |
| `hubCore.backgroundBottom` `#1A1A24` | `color.surfaceShell` |
| `theme.hybrid.panelCool` `#EDF1F7` | `color.surfaceCard` |
| `theme.colors.CeolWhite` `#FFFFFF` | `color.surfaceCardAlt` |
| `theme.hybrid.panelCoolBorder` | `color.divider` |
| `theme.colors.text.primary` `#F4F1EA` | `color.textOnDark` |
| `theme.colors.text.secondary` | `color.textMutedOnDark` |
| `theme.colors.textOnLight` `#0B1628` | `color.textOnLight` |
| `theme.colors.textOnLightMuted` | `color.textMutedOnLight` |
| `hubCore.imperialGold` / `theme.colors.primary` `#C5A059` | `color.accentGold` |
| `vionaTokens.colors.universe.local.accent` `#14B8A6` | `color.universe.local` |
| `vionaTokens.colors.universe.travel.accent` `#2563EB` | `color.universe.travel` |
| `vionaTokens.colors.universe.academy.accent` `#7C3AED` | `color.universe.academy` |
| `premiumUniverseAccentByHub.business` = gold `#C5A059` | `color.universe.business` |
| `premiumUniverseAccentByHub.account` = gold `#C5A059` | `color.universe.account` |
| `theme.colors.danger` `#E57373` | `color.universe.sos` |
| `FontFamily.regular` … `extrabold` | `fontFamily.regular` … `extrabold` |
| `theme.typeScale.h1` 30 / 38 | `typography.display` (weight 800) |
| `theme.typeScale.h2` 22 / 30 | `typography.title` |
| `theme.typeScale.body` 15 / 22 | `typography.body` |
| `theme.typeScale.caption` 12 / 18 | `typography.caption` |
| `theme.spacing` xs–xxl | `spacing.xs`–`spacing.xxl` |
| `vionaTokens.spacing.32` | `spacing.xxxl` |
| `theme.radius` | `radius` |
| `theme.elevation.card` plus `theme.colors.glass.shadow` `#000000` | `elevation.cardOnShell` |
| `theme.elevation.modal` plus `#000000` | `elevation.modal` |

Later UI packs migrate one surface at a time by changing that surface's import. This file does not perform that migration.
