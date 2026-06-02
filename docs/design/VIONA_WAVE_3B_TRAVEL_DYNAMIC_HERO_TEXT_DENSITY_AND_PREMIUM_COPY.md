# VIONA Wave 3B — Travel dynamic hero text density and premium copy

## Goal

Increase Travel dynamic hero text hierarchy and density to match Local/Home visual weight without layout redesign.

## Local reference (read-only)

| Element | Local `LocalDynamicHero` | Travel (before) |
|---------|--------------------------|-----------------|
| Kicker | 11px, uppercase, letterSpacing 2 | 10px, sparse |
| Headline | 26px / 32 line (22 narrow) | 19–23px |
| Subtitle | 14px / 21 line | 10–11px, 2 lines |
| Trust rail | 3 pills under subtitle | None |

## Travel changes

### Copy (`travelHub.*`)

- **Kicker:** TRAVEL LITE (unchanged)
- **Headline:** companion line (unchanged in VI)
- **Subtitle:** fuller airport/transport/interpreter/safety/local support line with no-booking disclaimer
- **Trust chips:** `heroTrust.lite` · `heroTrust.demo` · `heroTrust.preview`

### Typography

Responsive metrics in `travelDynamicHeroMetrics()` — desktop headline 26/32 (Local parity), subtitle 13/19, 3 lines; trust strip under subtitle.

### Visual

- Wider left scrim (72%)
- Text stack gap 8px, stronger headline glow
- Midnight/cyan trust rail (Local grammar, Travel soul)

## QA

```bash
npx expo start --web --port 8093
node scripts/capture-travel-dynamic-hero-text-density-and-premium-copy.mjs
```
