# VIONA.WAVE_3B.HOME_LIGHT_NETWORK_AND_FOR_YOU_SCALE_POLISH.1

## Goal
Lightly polish Home without changing structure:
1. Add Local-style premium light-network hover effect to the Home dynamic hero.
2. Increase height and icon/text scale of "VIONA dành cho bạn" quick-action pills.

## Home hero lighting

### Implementation
- Reused the shared `LocalLightingNetworkEdge` / `LocalHeroNetworkPulse` geometry via thin Home aliases:
  - `src/components/viona/HomeLightingNetworkEdge.tsx`
  - `src/components/viona/HomeHeroNetworkPulse.tsx`
- Wired in `HomeScreen.tsx` on the fashion-desktop living hero shell (web only):
  - **Accent:** gold primary (`accentGold`), cyan secondary (`accentCyan`) — Human Constellation mood.
  - **Activation:** `heroNetworkLit` = direct hero hover OR world-card-driven living hero swap (non-default key).
  - **On hover (web/desktop pointer):**
    - Image brighten wash (opacity 0 → 0.05, white overlay inside image clip only)
    - `HomeLightingNetworkEdge` boosted
    - `HomeHeroNetworkPulse` active (1–2 travelling dots along lower-right polyline)
    - Gold hover rim (opacity 0 → 0.55)
  - **Reduced motion:** pulse disabled; static glow/network boost via opacity animation only.
  - **Mobile/touch:** no hover handlers; network layer not rendered off web desktop shell.
- Network anchored lower-right — does not cover hero copy (left) or faces (upper-centre).
- No image zoom/crop/layout shift.

## VIONA dành cho bạn scale

Adjusted in `HomeScreen.tsx` `FashionHomeDaylightQuickActionPill` styles only:
| token | before | after |
| --- | --- | --- |
| `minHeight` | 36 | 44 |
| icon capsule | 22×22 | 26×26 |
| icon size | 15 | 17 |
| label font | 12/16 | 13/18 |
| gap / padH | 8 / 13 | 10 / 14 |

Non-daylight fallback `VionaQuickActionPill` unchanged (not in scope for fashion desktop shell).

## Unchanged
- Home IA, routes, handlers, hero images, world cards, Care Heart Fund, SOS gate, top header.

## Evidence
`docs/design/evidence/wave-3b-home-light-network-and-for-you-scale/` — 5 viewports via `scripts/capture-home-light-network-for-you-scale.mjs`.
