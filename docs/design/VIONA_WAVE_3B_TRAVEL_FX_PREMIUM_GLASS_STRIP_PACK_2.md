# VIONA WAVE 3B — Travel FX Premium Glass Strip (Pack 2)

**Pack:** `VIONA.WAVE_3B.TRAVEL_FX_PREMIUM_GLASS_STRIP.PACK_2`

## Protocol check

Aligned with `VIONA_OPERATING_PROTOCOL.md` — Class A UI/copy; FX is **reference/demo only**; no exchange, payment, remittance, or live market claims.

## Scope

- Upgrade Destination module FX row into a compact **premium glass strip** supporting cinematic weather cards (Pack 1).
- **In scope:** `TravelDestinationContextFxRow`, demo data array, glass chip styling, safety microcopy.
- **Out of scope:** Travel hero, quick help, lens cards, Local hero, Home, routes/navigation, weather mini-card layout (except spacing alignment).

## Visual grammar

| Element | Treatment |
|---------|-----------|
| Strip container | Dark glass panel, soft cyan/gold sheen, rounded 12px |
| Section kicker | `TỶ GIÁ THAM KHẢO` |
| Demo badge | `tham chiếu demo` |
| Chips | Pair label + value, swap icon capsule, cyan/gold accent |
| Safety line | `Chỉ để tham khảo khi chuẩn bị hành trình. Không phải dịch vụ đổi tiền.` |

## Demo data

`TRAVEL_FX_REFERENCE_DEMO_ITEMS` — static placeholders with safety comment.  
Resolver `resolveTravelFxReferenceDemoItems(homeCountryCode)` is future-ready for destination country, local currency code, API timestamp.

Default EU demo pairs:
- EUR → USD (1 EUR ≈ 1,08 USD)
- USD → local, EUR → local (demo local)
- EUR → VND, USD → VND (demo VND)

## Responsive

| Breakpoint | FX behavior |
|------------|-------------|
| Desktop | Wrapped chip row inside glass strip below weather |
| Tablet | Max 2 wrap rows |
| Mobile | Horizontal scroll chips, compact height |

## testIDs

- `travel-destination-context-fx-row`
- `travel-fx-reference-chip-{id}`

## Evidence

`docs/design/evidence/wave-3b-travel-fx-premium-glass-strip-pack-2/`
