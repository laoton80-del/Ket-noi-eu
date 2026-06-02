# VIONA Wave 3B — Travel true parity: lighting + lens cards

## Principle

Reuse Local/Home structural grammar and lighting quality; keep Travel imagery, copy, cyan semantics.

## Changes

### Dynamic hero
- Local-weight typography (desktop 28/34 headline, 14/21 subtitle)
- `TravelHeroLightingNetwork` — Local edge + pulse + text-safe cyan field
- Stronger trust rail readability
- Fullscreen trim tuned for hero dominance (40px)

### Lens cards (Góc nhìn du lịch)
- Desktop min-height **196px** (hero preview, not low tile)
- Full-bleed imagery + scrim + `TravelCardLightingNetwork`
- Larger title/subtitle/badge typography
- Primary intensity + hover/selected glow parity

## QA

```bash
npx expo start --web --port 8093
node scripts/capture-travel-true-parity-lighting-and-lens-cards.mjs
```
