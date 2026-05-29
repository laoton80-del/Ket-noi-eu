# VIONA Wave 3B — Local hero cards semantic visual cleanup

**Pack:** `VIONA.WAVE_3B.LOCAL_HERO_CARDS_SEMANTIC_VISUAL_CLEANUP.1`  
**Type:** Visual semantic correction, no IA/logic changes

## Intent

Fix semantic mismatch in Local hero cards while preserving premium Home-family feel:

- Remove obviously wrong borrowed universe imagery (travel/business/academy scenes) from Local cards.
- Keep cards visually non-empty and polished.
- Preserve existing handlers, status semantics, and opening IA.

## Changes

- `LocalHeroCardsRow` now uses Local-safe imagery strategy:
  - all four cards use Local image source: `viona-home-local-night-market.png`
  - each card has distinct crop focus (web `objectPosition`) for variation:
    - My Requests
    - Send Booking Assist
    - Legal & Wealth
    - Browse Services
- `LocalHomeParityCard` now accepts optional `imageStyle` pass-through to `VionaFashionWorldCard` for controlled semantic crop.

## Outcome

- Cards remain visually filled.
- No card presents clearly wrong universe cues.
- Opening still reads as same product family as Home.
- Hero remains dominant; Local for you remains compact; lower IA stays unchanged.

## Evidence

Run:

```bash
node scripts/capture-local-hero-cards-semantic-visual-cleanup.mjs
```

Output:

`docs/design/evidence/wave-3b-local-hero-cards-semantic-visual-cleanup/`
