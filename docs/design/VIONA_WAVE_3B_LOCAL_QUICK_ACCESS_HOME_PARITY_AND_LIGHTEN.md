# VIONA Wave 3B — Local quick access Home parity and lighten

**Pack:** `VIONA.WAVE_3B.LOCAL_QUICK_ACCESS_HOME_PARITY_AND_LIGHTEN.1`  
**Type:** Structure and hierarchy refinement (no business-logic changes)

## Intent

Align Local quick access with Home's compact "for you" grammar and reduce visual heaviness after the opening stage:

1. Compact quick-access panel using wrap grid pills (not long dashboard rows)
2. Keep hero and four flagship cards as first and second priority
3. Push heavier service tiles lower while preserving all module access and handlers

## Quick Access redesign

- `LocalQuickActionsRow` now renders a compact responsive grid:
  - 1 column on very narrow widths
  - 2 columns on phones
  - 3 columns on tablets
  - 4 columns on desktop
  - 6 columns on wide desktop
- Uses short label + icon `VionaQuickActionPill` items only
- Preserved handlers:
  - Restaurants -> existing Leona restaurant prefill
  - Transit -> existing transit prefill
  - Rentals & housing -> classifieds scroll
  - Classifieds -> classifieds scroll
  - AI Receptionist -> existing screen navigate
  - Language Assist -> existing language sheet
- Section heading uses `localHub.reframe.quickAccessTitle` ("Local for you")

## Local page lightening

- Kept `LocalHubCompactStatusGuide` directly below opening stage
- Moved restaurant/transit primary tiles lower (after connected universes), not removed
- De-emphasized lower section visual weight using spacing + opacity for the moved primary section
- All secondary modules remain present and reachable

## Drift boundaries

- No route changes
- No payment/wallet logic changes
- No AI service logic changes
- No SOS logic changes
- No request/no-charge flow changes
- No module deletions; ordering/weight only

## Evidence

Run:

```bash
node scripts/capture-local-quick-access-home-parity.mjs
```

Outputs:

`docs/design/evidence/wave-3b-local-quick-access-home-parity/`
