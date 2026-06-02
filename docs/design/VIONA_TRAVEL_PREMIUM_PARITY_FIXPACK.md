# VIONA.TRAVEL.PREMIUM_PARITY_FIXPACK.1

## Goal
Bring Travel opening hero and quick-help cards to true premium parity with Local — singular accent rims, unified card layout grammar, stronger hero hierarchy — without redesigning Travel or changing routes/copy/handlers.

## Part A — Quick help card system
### Problems fixed
- Triple/quadruple border stacking (outer box-shadow + LCF accent rim + inner semantic rim + material edge bloom)
- Accent wash layers creating fake secondary border hues on photo cards
- Translation capsule cyan glint reading SOS-like

### Changes
- `LocalConstellationFrame`: `suppressAccentRim` — Travel owns outer semantic rim for flagship/quickHelp/hero
- `TravelGlassCard`: singular web/native frame styles; removed inner `quickHelpSemanticRim`; suppressed material rimLeft/edgeBloom/capsuleRadiance/quickHelpAura on flagship
- `TravelAppTile`: Local-grade status pill (8/4 padding, pill radius); lighter accent scrim; stronger text veil; plain title (no glow shadow)

### Semantic mapping (unchanged)
| Card | Accent |
|------|--------|
| Sân bay | cyan |
| Hỗ trợ phiên dịch | violet |
| Hỗ trợ xe | cyan |
| Khẩn cấp & cảnh sát | magenta |

## Part B — Dynamic hero premium alignment
### Problems fixed
- Gold `FASHION_HOME_FRAME_BORDER` premium edge fighting cyan Travel frame
- Duplicate heroEdgeBloom + heroHoverRim + LCF rim + TravelGlassCard multi-glow
- Weak title hierarchy vs Local grammar

### Changes
- Removed heroEdgeBloom, heroPremiumFrameEdge, heroHoverRim from TravelScreen
- Singular hero web/native frame via `travelHeroSemanticWebFrameStyle`
- Reduced route-arc overlay opacity; removed violet hero orb
- Typography: kicker 12px; title desktop 32/38; subtitle 14/22; tighter text stack rhythm

## Evidence
`docs/design/evidence/wave-travel-premium-parity-fixpack/`

Capture: `node scripts/capture-travel-premium-parity-fixpack.mjs`
