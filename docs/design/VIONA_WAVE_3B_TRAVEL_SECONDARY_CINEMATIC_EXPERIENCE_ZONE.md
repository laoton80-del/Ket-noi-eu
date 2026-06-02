# VIONA WAVE 3B — Travel Secondary Cinematic Experience Zone

**Pack:** `VIONA.WAVE_3B.TRAVEL_SECONDARY_CINEMATIC_EXPERIENCE_ZONE.4`

## Mental model

**Travel Experience Intelligence Zone** — cinematic premium experience below Travel Lens cards.

| Section | Role | User-facing labels |
|---------|------|-------------------|
| Destination Lens | Compact intro strip | ĐIỂM ĐẾN (kicker), i18n title/subtitle |
| Local Map Concierge | Visual anchor | HỖ TRỢ LOCAL LIÊN KẾT kicker in-card |
| Universe Bridge | Exit portals | Connected Universes kicker + chips |

## Design direction

- Premium dark glass, soft blue/cyan travel light
- Subtle emerald only for Local handoff accent
- Map/location lines as designed visuals — no debug panel
- No heavy green flood, no empty form slab, no admin row feel

## Destination Lens

- Horizontal glass strip with route/grid texture + light sweep + sparkle pin
- Left: kicker, title, underline lens input, subtitle, location CTA
- Right (desktop): weather pill, currency pill, demo note separated
- Compact height target: ~92–118px desktop

## Local Map Concierge

- In-card kicker `HỖ TRỢ LOCAL LIÊN KẾT` (replaces external section kicker)
- Cinematic map: vignette, faint grid, route line, glowing pin, 2 pulse rings, cyan/emerald nodes
- Map heights: desktop 136px, tablet 124px, mobile 104px
- Safety copy unchanged

## Universe Bridge

- Portal chips: dark glass, soft glow, rounded, icon capsule + chevron
- Semantic accents: Local emerald/cyan, Academy violet, Business gold
- Desktop horizontal row; mobile stacked

## Mobile safety

- `scrollBottomExtra`: 224px
- `hubScrollTailHeight`: 176px
- 12–16px card gaps; no dock/SOS overlap on Local + connected chips

## Constraints preserved

- No Travel opening hero / quick help / lens card changes
- No route/handler/logic drift
- No booking/payment/dispatch/fixer claims
- Home, Local hero, App.tsx, global.css, navigation untouched

## Evidence

`docs/design/evidence/wave-3b-travel-secondary-cinematic-experience-zone/`
