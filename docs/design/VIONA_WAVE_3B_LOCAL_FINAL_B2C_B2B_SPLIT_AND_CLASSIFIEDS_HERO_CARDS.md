# VIONA Wave 3B — Final B2C/B2B split and classifieds hero cards

**Pack:** `VIONA.WAVE_3B.LOCAL_FINAL_B2C_B2B_SPLIT_AND_CLASSIFIEDS_HERO_CARDS.1`  
**Type:** IA clarity and visual parity finalization (no route/logic changes)

## Intent

- Finalize strict B2C vs B2B separation on Local.
- Remove remaining duplicate service-module rendering from Local main flow.
- Keep classifieds high and restyle listing cards to hero-card grammar.

## Final Local order

1. Local Dynamic Hero
2. Four Local hero cards
3. LOCAL FOR YOU (all key B2C actions)
4. Request Status Guide (light)
5. Classifieds (premium hero-card style)
6. FOR VIETNAMESE BUSINESSES (compact B2B handoff)
7. Connected Universes (compact bottom mini-links)

## Changes made

- Added `LocalClassifiedsHeroSection`:
  - premium hero-card style listings using `LocalHomeParityCard`
  - semantic accents and icon/status cues
  - wallet hint and clear "New listing" CTA
  - preserves existing listings data + composer trigger from `LocalScreen`
- Removed remaining duplicated mid-flow service-module rendering from Local page composition.
- Kept merchant/B2B tools compact and lower in page.
- Kept connected universes as compact low-weight bottom links.

## Safety boundaries

- No handler removal.
- No route changes.
- No payment/wallet logic changes.
- No AI/SOS/backend/auth changes.
- No Home changes.
- No fake production claims.

## Evidence

Run:

```bash
node scripts/capture-local-final-b2c-b2b-split-classifieds-hero-cards.mjs
```

Output:

`docs/design/evidence/wave-3b-local-final-b2c-b2b-split-classifieds-hero-cards/`
