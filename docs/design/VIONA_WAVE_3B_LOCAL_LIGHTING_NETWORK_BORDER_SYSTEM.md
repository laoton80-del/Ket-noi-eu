# VIONA.WAVE_3B.LOCAL_LIGHTING_NETWORK_BORDER_SYSTEM.1

A controlled premium **lighting-network edge accent** for the Local opening surfaces. It is a
subtle "intelligence" accent that enhances the frame/edge of a surface — **not** noisy interior
decoration. Applied only to the three opening tiers; secondary controls stay clean.

## Where it is applied

| Surface | Tier | Accent |
| --- | --- | --- |
| Local dynamic hero | `hero` (strongest, still subtle) | Emerald/cyan (Local default, theme-invariant) |
| 4 opening hero cards | `card` (medium) | Per-card semantic (emerald / cyan / gold / violet) |
| 3 featured classifieds cards | `classified` (lighter) | Category accent already resolved by the preview |

**Intentionally NOT decorated** (kept clean): Local For You pills, request status strip,
merchant secondary cards, connected-universe secondary cards, bottom navigation.

## The layer — `LocalLightingNetworkEdge.tsx`

A small, Local-only, **static** visual layer:

- A few SVG line segments (`react-native-svg`, `vectorEffect="non-scaling-stroke"`) + small
  glowing nodes + one soft corner glow.
- Anchored to the **lower-right / right edge**. Local copy + status pills are top/left aligned and
  hero faces sit upper-centre, so a lower-right anchor never covers text or faces.
- `pointerEvents: none`, self-clipped to the surface radius (`overflow: hidden` + `borderRadius`),
  absolute fill → **no layout shift**, never intercepts hover/press.
- Intensity is tiered via opacity/size/node-count; `boosted` lifts intensity only slightly on
  hover where the host already tracks that state. No animation, no permanent pulsing.

Geometry (viewBox `0..100`): main polyline `M96,38 → 52,96` with a short branch to the right
edge; 3 nodes (`card`/`classified`) or 4 nodes (`hero`).

## Implementation

- **Dynamic hero** (`LocalDynamicHero.tsx`): network added at `zIndex: 3` — above the image, below
  the copy (`zIndex 4`) and the crisp 1px frame overlay (`zIndex 5`). The frame and text always
  win. Accent forced to Local default emerald/cyan regardless of the active hero key, so the
  banner stays on-brand during card-hover crossfades. The current crisp frame, image fit/aspect,
  and `objectPosition` are untouched.
- **Hero cards** (`LocalHomeParityCard.tsx`): network rendered as the **top** child of the card
  host, confined to the lower-right so it never reaches the left-aligned title/status pill. Accent
  + a semantic secondary node tone are derived from the card's existing `accent`
  (`emerald→cyan`, `cyan→blue`, `gold→amber`, `violet→magenta`). `boosted` is wired to the
  existing `edgeLitHoverBoost`, so hover gently brightens the network alongside the existing rim
  motion. No double border, no broken corner lines.
- **Classifieds preview** (`LocalClassifiedsFeaturedPreview.tsx`): same card path with
  `networkTier="classified"` (lighter). Accent reuses the per-listing semantic accent the preview
  already assigns by category. Card count, create-listing / view-all / VIP pilot / safety copy
  logic are unchanged.

## Hover / theme

- Hover lifts only the `card`/`classified` networks (via `edgeLitHoverBoost`), and only slightly.
  The hero network is static.
- Theme toggle (Bật đèn/Tắt đèn) does not branch the Local glass tree, so the frame, glow, and
  network remain stable in both states.

## Safety

No routes, handlers, IA, images, or business logic changed. No payment/wallet/AI/SOS/backend/
auth/classifieds/merchant logic touched. Hero/card image assets are unchanged (the dense interior
networks visible in some assets are baked into the raster art; this layer only adds a controlled,
edge-anchored code accent on top).

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/local-final-hero-assets-{390x844,844x390,768x1024,1024x768,1366x768}.png`
