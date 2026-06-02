# VIONA.WAVE_3B.TRAVEL_CARD_GRAMMAR_AND_EMERGENCY_SEMANTIC_ALIGNMENT.1

## Goal
Align Travel flagship card internal layout to Local opening-card grammar and fix emergency card SOS magenta semantic (no violet/purple drift).

## Local vs Travel audit (before)
| Element | Local (`LocalAppTile`) | Travel flagship (before) |
|---------|------------------------|--------------------------|
| Padding | 12v / 12h | asymmetric paddingV+2 top |
| Stack gap | 10 (icon row → text) | 8 |
| Text block | wrapped, gap 4 title/subtitle | title/subtitle loose in stack |
| Icon row | icon left, status right, center-aligned | same structure |
| Title | 13/17, upper block | 14.5/18, felt lower in tall card |
| Status pill maxWidth | 58% | 42% |
| Bottom veil | n/a (no photo) | heavy bottom gradient (0.42 @ 55%) |
| Emergency frame | n/a | `travelFrameAccent(magenta)` → **violet** |

## Layout adjustments
- Flagship padding: `paddingVertical: 12` (Local parity)
- Stack gap: 10; new `flagshipTextBlock` with gap 4
- Title: 13/17 (Local match)
- Removed `flex: 1` from content stack (no bottom stretch)
- Lightened bottom artwork veil (0.26 @ 68%)
- Status pill maxWidth 58%

## Emergency semantic fix
- **Root cause:** `travelFrameAccent('magenta')` returned `'violet'` → purple LocalConstellationFrame rim
- **Fix:** magenta maps to neutral `'cyan'` slab; SOS rim from `travelSemanticTokens(magenta)` via:
  - `travelSosMagentaWebFrameStyle` (web box-shadow)
  - Native magenta border on outer frame
  - Boosted magenta edge bloom on flagship/quickHelp
- Icon capsule, status pill, material layers already used magenta tokens

## Evidence
`docs/design/evidence/wave-3b-travel-card-grammar-and-emergency-semantic-alignment/`

Capture: `node scripts/capture-travel-card-grammar-and-emergency-semantic-alignment.mjs`
