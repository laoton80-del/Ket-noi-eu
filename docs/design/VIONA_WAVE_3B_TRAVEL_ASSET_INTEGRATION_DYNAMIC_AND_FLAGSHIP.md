# VIONA Wave 3B — Travel Asset Integration (Dynamic + Flagship)

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_ASSET_INTEGRATION_DYNAMIC_AND_FLAGSHIP.1`

## Goal

Integrate eight Travel-only PNG assets into the Travel hub while preserving Local/Home opening grammar, routes, copy, and safety labels.

## Asset directory

`assets/viona/travel/`

### Dynamic hero (opening stage)

| Key | File | Use |
|-----|------|-----|
| `default` / `journey` | `viona-travel-dynamic-journey-airport-v1.png` | Default hero + journey/overview hover |
| `transit` | `viona-travel-dynamic-transit-hub-v1.png` | Transport / transit hover |
| `family` | `viona-travel-dynamic-family-city-transit-v1.png` | Reserved family/local journey variant |
| `global` | `viona-travel-dynamic-global-airport-v1.png` | Global airport / support hover |

### Flagship card artwork

| Scenario ID | Card title (vi) | File |
|-------------|-----------------|------|
| `airport` | Hành trình của tôi | `viona-travel-hero-journey-overview-v1.png` |
| `translation` | Hỗ trợ phiên dịch | `viona-travel-hero-interpreter-assist-v1.png` |
| `taxi` | Di chuyển & xe | `viona-travel-hero-transport-assist-v1.png` |
| `emergency` | Khẩn cấp & cảnh sát | `viona-travel-hero-emergency-safety-v1.png` |

### Hover crossfade mapping (flagship → dynamic hero)

| Flagship | Dynamic key |
|----------|-------------|
| `airport` | `journey` |
| `translation` | `global` |
| `taxi` | `transit` |
| `emergency` | `global` |

## Implementation

- Registry + helpers in `src/screens/b2c/TravelScreen.tsx`
- Flagship full-bleed cover on `TravelAppTile` (`objectFit: cover`, no contain/gutters)
- Hero crossfade on flagship hover (220ms ease-out), default returns on leave
- Opening-stage height lock unchanged (Local parity: 1600/624, min 430px desktop)
- Tab bar hidden on Travel focus; dock hidden on desktop web first view

## Legacy

`viona-travel-hero-default-1600x520.png` remains on disk but is no longer referenced at runtime.

## Evidence

`docs/design/evidence/wave-3b-travel-asset-integration-dynamic-and-flagship/`  
Script: `scripts/capture-travel-asset-integration-dynamic-and-flagship.mjs`
