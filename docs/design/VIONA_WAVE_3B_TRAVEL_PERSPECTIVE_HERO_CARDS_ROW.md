# VIONA Wave 3B — Travel Perspective Hero Cards Row

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_PERSPECTIVE_HERO_CARDS_ROW.1`

## Goal

Upgrade “Góc nhìn du lịch” from flat text cards to one premium hero-card row with background images, matching Home/Local visual grammar.

## Before

- Collapsible section via `TravelDirectionSelector`
- Desktop: 2-column wrap (`48.5%` width) — third card wrapped alone
- Text-only `TravelGlassCard` standard visual, no hero artwork
- minHeight ~44px inner padding

## After

- `TravelPerspectiveCardsRow` in `TravelScreen` (same handlers/copy/expand behavior)
- `TravelAppTile` `perspective` variant with full-bleed cover + gradient veil
- Desktop ≥1024: 3 equal columns, one row
- Tablet 520–1023: 2 columns
- Mobile &lt;520: single column stack
- Dedicated perspective PNGs from `assets/viona/travel/`

## Asset mapping

| Direction ID | Title (vi) | Asset | Accent |
|--------------|------------|-------|--------|
| `vietnameseAbroad` | Người Việt đi nước ngoài | `viona-travel-perspective-vietnamese-abroad-v1.png` | cyan |
| `inboundVietnam` | Người nước ngoài đến Việt Nam | `viona-travel-perspective-foreigner-to-vietnam-v1.png` | gold |
| `returnVietnam` | Kiều bào về Việt Nam | `viona-travel-perspective-overseas-vietnamese-return-v1.png` | violet |

## Evidence

`docs/design/evidence/wave-3b-travel-perspective-hero-cards-row/`  
Script: `scripts/capture-travel-perspective-hero-cards-row.mjs`
