# VIONA.WAVE_3B.TRAVEL_RESTORE_PREMIUM_FRAME_AND_LOCAL_CARD_GRAMMAR.1

## Goal
Restore Travel premium frame depth and align dynamic hero + quick-help card grammar with Local — without redesign, route/copy/handler drift, or Local/Home file edits.

## Root causes (audit)
| Area | Local | Travel (before) | Why Travel felt flat |
|------|-------|-----------------|----------------------|
| Hero title | 26/32 desktop, top-aligned copy | 32/38 tokens but `justifyContent: 'center'` + weak base styles | Title floated mid-stage → empty hero |
| Hero frame | Crisp edge + hover semantic rim | Outer glow only after prior strip pass | Looked flat / under-framed |
| Card frame | Material + inner rim + accent glow (single family) | `suppressAccentRim` + minimal glow | Cards lost premium edge |
| Card layout | Icon top-left, badge top-right, title block follows | Same structure but heavy bottom scrim | Text felt bottom-heavy |

## Fixes
### TravelScreen
- `TRAVEL_HERO_TYPOGRAPHY`: desktop **36/42** (+2 fullscreen), Local-matched kicker/subtitle rhythm
- Hero stage `justifyContent: 'flex-start'` (Local copyCol parity)
- Restored cyan crisp frame edge + semantic hover rim (no gold double-hue)

### TravelGlassCard
- Stronger singular semantic web frame (1px stroke + dual same-hue glow layers)
- Flagship corner accent wash (atmosphere, not second border)

### TravelAppTile
- Local icon 24px / capsule 44 on desktop
- Narrow left text scrim + bottom-only veil (upper/middle content zone)
- Top-aligned stack (`alignSelf: 'flex-start'`)

## Semantic mapping (unchanged)
| Card | Accent |
|------|--------|
| Sân bay | cyan |
| Hỗ trợ phiên dịch | violet |
| Hỗ trợ xe | cyan |
| Khẩn cấp & cảnh sát | magenta |

## Evidence
`docs/design/evidence/wave-3b-travel-restore-premium-frame-and-local-card-grammar/`

Capture: `node scripts/capture-travel-restore-premium-frame-and-local-card-grammar.mjs`
