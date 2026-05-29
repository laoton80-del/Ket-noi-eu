# VIONA Wave 3B — Remove duplicate cards and expand LOCAL FOR YOU

**Pack:** `VIONA.WAVE_3B.LOCAL_REMOVE_DUPLICATE_CARDS_AND_EXPAND_LOCAL_FOR_YOU.1`  
**Type:** IA cleanup and visual weight reduction (no logic/routing changes)

## Intent

- Promote `LOCAL FOR YOU` as the main B2C Local action hub.
- Remove duplicated large B2C service cards from lower page flow.
- Keep classifieds high in the page after opening + status.
- Keep B2B tools separated and compact.
- Keep connected universes as compact bottom links only.

## Changes

- Expanded `LocalQuickActionsRow` to 8 compact B2C actions:
  - Restaurant
  - VIONA Transit
  - Rentals & housing
  - Classifieds
  - Nails & spa
  - Community events
  - Language assist
  - AI Receptionist
- Updated responsive quick-action grid:
  - mobile: 2 cols (3 cols on larger phones)
  - tablet: 4 cols
  - desktop: 4 cols
  - wide desktop: 8 cols
- Removed duplicate large B2C card rendering from lower Local flow:
  - removed large nails/events/housing/classifieds cards
  - removed lower large restaurant/transit section
- Kept only unique non-duplicated support tool in the "explore more" area (legal scanner, if feature flag is enabled).

## Safety + scope checks

- No handlers removed.
- No routes changed.
- No payment/wallet/AI/SOS/backend/auth changes.
- No Home screen changes.
- No fake production claims.

## Evidence

Run:

```bash
node scripts/capture-local-remove-duplicate-cards-expand-local-for-you.mjs
```

Output:

`docs/design/evidence/wave-3b-local-remove-duplicate-cards-expand-local-for-you/`
