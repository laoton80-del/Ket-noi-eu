# VIONA Wave 3B — Local IA cleanup (B2C/B2B separation)

**Pack:** `VIONA.WAVE_3B.LOCAL_IA_CLEANUP_B2C_B2B_SEPARATION.1`  
**Type:** Information architecture cleanup, no logic changes

## Intent

Make Local clearly B2C-first after the Home-grammar reframe:

1. Keep opening stage as-is (hero -> 4 cards -> LOCAL FOR YOU)
2. Move Classifieds up in the B2C flow
3. Reduce duplicate large service emphasis early
4. Separate merchant/B2B operations into a compact lower section
5. Convert connected universes into compact bottom links

## New IA order

1. Opening stage (`LocalDynamicHero`, `LocalHeroCardsRow`, `LocalQuickActionsRow`)
2. Light request status guide
3. Classifieds (feed + composer)
4. Explore more local tools (secondary Local services)
5. For Vietnamese businesses (compact merchant tools)
6. Local commerce capability block
7. Lower duplicate restaurant/transit service cards
8. Connected universes compact links at bottom

## B2C/B2B separation

- Added `LocalMerchantToolsSection` for compact B2B handoff:
  - Business hub
  - Booking assist intake
  - AI receptionist
- Preserved handlers and routes; moved visual priority lower.

## Connected universes compaction

- Added `LocalConnectedUniverseLinks` for compact links:
  - Travel Lite
  - Business hub
  - Academy Lite
- Replaced large mid-flow connected-universe tiles with low-weight bottom links.

## Safety boundaries

- No function removal.
- No route/handler changes.
- No payment/wallet/AI/SOS/backend/auth changes.
- No fake production claims.

## Evidence

Run:

```bash
node scripts/capture-local-ia-cleanup-b2c-b2b-separation.mjs
```

Output:

`docs/design/evidence/wave-3b-local-ia-cleanup-b2c-b2b-separation/`
