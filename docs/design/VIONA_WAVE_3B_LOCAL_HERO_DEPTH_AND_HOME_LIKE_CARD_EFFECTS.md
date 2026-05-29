# VIONA Wave 3B — Local Hero Depth + Home-Like Card Effects

Task ID: `VIONA.WAVE_3B.LOCAL_HERO_DEPTH_AND_HOME_LIKE_CARD_EFFECTS.1`

## Goal

Post daylight-hub reframe fine-tune:
1. Make the Local dynamic hero slightly deeper/taller for a more cinematic premium feel.
2. Make the 4 Local hero cards feel like the same premium family as Home (depth, edge light,
   hover response, polished glow) — clean, not noisy neon.

## A. Dynamic hero height/depth

The hero frame height is width-driven via `aspectRatio` (the image stays 1600×520 via `cover`).
Tuning, in `LocalDynamicHero.tsx` only:

- Frame aspect `1600/548 → 1600/570` (frame a touch taller). Adds a small, even crop
  (~4% per side) — no `scale` transform, no negative inset, image still inside the frame.
- `minHeight` floors `192 / 222 / 262 → 198 / 228 / 276` (compact / narrow-mobile / default).
- `maxHeight` caps `312 / 464 → 324 / 496` so the deeper desktop banner is not clipped.

Measured effective heights (deeper vs prior pass):

| Viewport | Before | After | Δ |
| --- | --- | --- | --- |
| Desktop 1366 (full-width ~1334) | ~457 | ~477 | +20 |
| Landscape tablet / 1024 (~992) | ~340 | ~353 | +13 |
| Tablet portrait 768 (floor) | 262 | 276 | +14 |
| Mobile 390 (floor) | 222 | 228 | +6 |
| Compact 844×390 | ~281 | ~292 | +11 |

Within the requested feel (desktop +20–28, tablet +12–18, mobile ≤ +8). Left text-safe area,
readability, aspect-ratio logic, no overflow, and no white gutters are preserved.

## B. Home-like card effects

`LocalHomeParityCard` already reuses Home's world-card effect functions
(`fashionHomeWebDaylightWorldCardMaterialStyle`, `…InnerRimStyle`,
`fashionHomeWebWorldCardHostHoverMotionStyle`, corner-lit + bottom-veil glass layers, and the
edge-lit image hover filter inside `VionaFashionWorldCard`), all driven by `edgeLitHoverBoost`
(wired through `LocalHeroCardsRow` → `hoveredHeroKey` on cell hover).

The one thing Home adds that Local lacked was a **persistent base CSS transition**
(`fashionHomeWebDaylightTransitionStyle`, i.e. Home's `fashionHomeWebTintTransition`). Without
it, Local's hover glow/rim/lift only eased **in** (the hover-motion style supplies a transition
only while hovered) and snapped **out**. Added it to the card host (web), so on hover Local now:

- eases the material box-shadow depth up and back down,
- sharpens the semantic inner rim (per-accent hover color) smoothly,
- lifts subtly (`translateY -1`, `scale 1.004`) with smooth return,
- brightens the interior image (existing contrast/saturate hover filter),

…matching Home's two-way premium response. Single 1px semantic rim is preserved (host clip +
rim + inner card all at `radius.lg`), so **no double-border artifacts** and all 4 cards stay
consistent. Semantic accents unchanged: My requests = emerald, Send booking assist = cyan,
Legal & wealth = gold, Browse services = violet.

No shared tokens, Home implementation, `VionaFashionWorldCard`, or `fashionHomeDesktopShell`
were modified — only Local files consume existing exports.

## Hover / theme result

- Hover each of the 4 cards: rim sharpens, glow/depth increases, subtle lift, smooth in/out.
- Day/Night (`Bật đèn` / `Tắt đèn`) toggle: Local hero/cards are theme-invariant premium glass
  — frames and glow remain unchanged across the toggle (behavior unchanged by this pass).

## Preserved good work

Daylight hero/card images, hero `objectPosition` fixes, crisp border fixes, Local For You scale,
classifieds preview cap, request-only / no-payment safety copy, and B2C/B2B separation are all
untouched.

## Safety drift report

No IA, routes, handlers, payment/wallet/AI/SOS/backend/auth/classifieds/merchant logic changed.
Home was read-only reference. Pure presentational changes in two Local components. No horizontal
overflow; no white gutters at 768×1024.

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/*` re-captured at `EXPO_CAPTURE_PORT=8093`
across 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Commit status

NOT COMMITTED.
