# VIONA Wave 3B — Travel perspective mode selector (not gate)

## Goal

Make **Góc nhìn du lịch** a personalization mode selector, not a mandatory entry gate.

## Behavior

| Rule | Implementation |
|------|----------------|
| Default mode | `overview` — Travel opens with no lens selected |
| No entry block | Location consent unchanged; perspective never blocks hub |
| No onboarding modal | Collapsible section only (existing pattern) |
| All features stay | Utility grid keeps all 8 scenarios; order only changes |
| Card select | Toggle: tap active card again → back to overview |
| Utility priority | Reordered by selected perspective via stable sort |
| Copy | Reuses existing `travel.direction.*` and scenario subtitle keys |

## Priority mapping

See `TRAVEL_UTILITY_PRIORITY_BY_MODE` in `TravelScreen.tsx`.

## Files

- `src/screens/b2c/TravelScreen.tsx`
- `src/components/travel/TravelAppTile.tsx` (selected rim/glow)
- `scripts/capture-travel-perspective-mode-selector-not-gate.mjs`
- `docs/design/evidence/wave-3b-travel-perspective-mode-selector-not-gate/*`

## QA

```bash
npx expo start --web --port 8093
node scripts/capture-travel-perspective-mode-selector-not-gate.mjs
```
