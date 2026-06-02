# VIONA WAVE 3B — Travel Weather Cinematic Mini Cards (Pack 1C Final Tune)

**Pack:** `VIONA.WAVE_3B.TRAVEL_WEATHER_CINEMATIC_MINI_CARDS.PACK_1C_FINAL_TUNE`

## Protocol check

Aligned with `VIONA_OPERATING_PROTOCOL.md` — Class A UI; demo weather only; no fake live forecast claims. No route/handler/navigation drift.

## Final tune goals (1B → 1C)

- Reduce washed-out / misty look; restore cinematic mid-tone depth without dark tech-panel regression
- Sharper icon, temperature, day, and condition labels; stronger footer veil for readability
- Per-mood atmosphere cues more distinguishable (sun glow, cloud veils, rain/wet gloss, amber golden hour, cool overcast, wind streaks)
- Desktop row: narrower cards (~136–144px) so 5–6 cards read clearly; right-edge fade + chevron scroll affordance when row overflows
- Preserve module balance: weather primary, FX strip secondary; airport backdrop and left title/CTA remain readable

## Card sizes (1C)

| Tier | Width | Height | Today width bump |
|------|-------|--------|------------------|
| Desktop (≥1024) | 124px | 132px | +8px |
| Tablet (768–1023) | 132px | 128px | +8px |
| Mobile (<768) | 136px | 128px | +8px |

## Visual treatments

- Reduced pale sheen / white haze; horizontal depth vignette on cards
- Mood gradients tuned for higher mid-tone contrast + per-mood `skyTint`
- Scene photo opacity 0.56 (was brighter/washed in 1B)
- Desktop scroll shell: right fade gradient + chevron cue (`showScrollAffordance` on two-column layout)

## Demo safety

Label: **thời tiết tham chiếu demo** (unchanged). Static demo 7-day preview; no live production forecast implication.

## Scope guard

Touched: Travel destination weather cinematic mini cards only (`TravelScreen.tsx` weather row + mini card visuals).

Not touched: Travel hero, quick help, lens/góc nhìn cards, Local hero, Home, Local Assistance, routes, App.tsx, global.css, FX strip logic.

## Evidence

`docs/design/evidence/wave-3b-travel-weather-cinematic-mini-cards-pack-1c-final-tune/`
