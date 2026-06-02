# VIONA WAVE 3B — Travel Secondary Premium Local Assist Polish

**Pack:** `VIONA.WAVE_3B.TRAVEL_SECONDARY_PREMIUM_LOCAL_ASSIST_POLISH.1`  
**Scope:** Travel secondary zone only — Destination card, Local Assistance handoff, connected universe chips.

## Goals

- Destination: compact premium glass assistant (not empty dark form panel).
- Local Assistance: cinematic Travel × Local handoff with map context layer (not debug/admin map).
- Connected chips: semantic pill parity with Local hub.
- No route/handler/safety meaning drift.

## Visual changes

### Destination card (`travel-destination-card`)

- Kicker `ĐIỂM ĐẾN`, input prompt via placeholder, helper line, demo preview suffix `(tham chiếu demo)`.
- `intensity="quiet"` + `compact` glass; top sheen; hairline cyan border.
- Reduced vertical dead space (tighter gaps, 36px input on desktop).

### Local Assistance card (`travel-local-assist-card`)

- Kicker outside card; title `Hỗ trợ địa phương`; subtitle fixer handoff copy.
- Removed inner people/debug panel; map preview with grid, route arc, dotted path, dual pulse rings, pin.
- Safety note + premium circular arrow affordance unchanged in meaning.

### Section rhythm

- `destinationToLocalGap`: 20px desktop / 14px mobile between cards.
- Local map shell taller (132px desktop) vs compact destination.

### Connected universe chips

- Per-accent semantic borders (emerald / violet / gold) in normal state — Local chip grammar.

## Evidence

`docs/design/evidence/wave-3b-travel-secondary-premium-local-assist-polish/`

Capture: `node scripts/capture-travel-secondary-premium-local-assist-polish.mjs`

## Safety (unchanged)

- Map hint: illustration only, not service booking.
- Footer: no booking / fixer commitment / payment / dispatch.
- Demo weather/FX line labeled `(tham chiếu demo)`.
