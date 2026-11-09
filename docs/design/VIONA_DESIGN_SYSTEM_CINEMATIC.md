# VIONA Design System — cinematic source

`src/design/vionaCinematicTokens.ts` is the single token source. Home cinematic already imports it. Dark shell and dark glass cards. Not light gray cards.

UI-1 `src/design/system/*` is deprecated. The export names remain and now alias this source. Nothing under `src/screens` imports it. Do not delete it until a later grep is empty.

The image gate stays: `IMAGE_PROVENANCE` is `unverified`, so card photos do not render until a later licensed change.

## Canonical values

| Token | Value |
| --- | --- |
| `color.backgroundDeep` | `#020713` |
| `color.backgroundShell` / `midnight` | `#07111C` |
| `color.surfaceNavy` / `navy` | `#0B1C33` |
| `color.surfaceGlass` / `glass` | `rgba(8, 20, 36, 0.78)` |
| `color.accentGold` / `gold` | `#E7C27A` |
| `color.textOnDark` / `ice` | `#F4F8FC` |
| `color.textMutedOnDark` / `muted` | `#B7C6D6` |
| `universe.local` | `#F3B15A` |
| `universe.travel` | `#5EB6FF` |
| `universe.academy` | `#C4B5FD` |
| `universe.business` | `#3DDC97` |
| `universe.account` | `#7DD3FC` |
| `universe.sos` | `#FF5C6A` |
| `space` | 4, 8, 12, 16, 20, 24, 32 |
| `radius` | sm 12, md 18, lg 24, xl 28, pill 999 |
| `typography` | Montserrat 800 display 34/40, 700 title 22/30, 400 body 15/22, 400 caption 12/18 |
| `zIndex` | base 0, card 1, sticky 10, overlay 20, modal 40 |
| `elevation.cardOnShell` | y 10, opacity 0.45, radius 18, elevation 8 |
| `elevation.modal` | y 16, opacity 0.55, radius 24, elevation 16 |

`radius.md` and `radius.lg` are unchanged because Home cards and the companion use them. `layout.railWidth` and `layout.companionWidth` are unchanged. The old unused spacing 6/10/16/24/32 was not read by Home, so the scale is now the single 4-based scale.

## Old name to cinematic token

| Old export | Now aliases |
| --- | --- |
| `hubCore.backgroundTop` | `backgroundShell` |
| `hubCore.imperialGold` | `accentGold` |
| `theme.colors.primary` / `SignatureGold` | `accentGold` |
| `theme.colors.background` | `backgroundShell` |
| `theme.colors.danger` | `safety` |
| `theme.spacing` | `space` |
| `theme.radius` | `radius` |
| `theme.elevation.card` / `modal` | `elevation.cardOnShell` / `modal` |
| `theme.typeScale.h1` | `typography.display` |
| `FontFamily` | `cinematicFontFamily` |
| `b2cTheme` / `b2bTheme` | cinematic shell, business accent, SOS notification |
| `V7_MIDNIGHT_B2C` / `V7_PLATINUM` | cinematic shell and gold |
| `KIDS_MODE_TOKENS.colors` | shell, academy, travel, local, SOS |
| `vionaTokens.colors` and `fashionTech` accents | cinematic shell, gold, six accents |
| `vionaNativeClearPremiumTokens.accent` | six cinematic accents |
| `vionaHybrid` / `vionaTrust` / `vionaOps` | cinematic shell, gold, travel, SOS |
| `emergencyUiTokens.shellBg` | `backgroundShell` |
| `vionaHybridDesignTokens` (UI-1) | same cinematic values; light-card hex retired |

Exported function names stay, including `resolveVionaCinematicTier`, `getAuraPair`, `vionaShellBackground`, and `vionaSurfaceColors`.

UI-1 hybrid light cards are deprecated. Do not use `#121212`, `#EDF1F7`, or `#C5A059` as the canonical shell, card, or gold.
