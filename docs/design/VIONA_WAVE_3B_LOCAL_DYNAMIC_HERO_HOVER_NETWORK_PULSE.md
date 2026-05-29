# VIONA.WAVE_3B.LOCAL_DYNAMIC_HERO_HOVER_NETWORK_PULSE.1

A premium, subtle hover activation for the Local **dynamic hero** (web/desktop only): on hover the
hero lifts slightly and one–two semantic light pulses travel along the existing light-network
overlay in the active hero's accent color.

## Root technical approach

The baked raster image is **never** animated. The effect is built from separate overlay layers
inside the existing hero frame:

1. **Base image layer** (unchanged) — hero raster + crossfade.
2. **Static network edge** — existing `LocalLightingNetworkEdge` (`tier="hero"`), now driven by the
   **active hero accent** and `boosted` on hover (network becomes a bit more visible).
3. **Animated pulse layer** — new `LocalHeroNetworkPulse`: 1–2 small accent-glow dots whose
   position is interpolated across the **same lower-right polyline vertices** the static network
   uses, so the light follows the network path (not random motion). Transform + opacity only →
   native driver, cheap, no layout shift.
4. **Image-brighten wash** — a faint white wash (`opacity 0 → 0.05`) over the image only, below the
   copy, so the hero "activates" without over-brightening faces or hurting legibility.
5. **Hover rim glow** — an accent-colored rim (`opacity 0 → 0.6`, 1.5px) above the crisp frame that
   fades in/out smoothly.

Hover state is animated via a single `hoverAnim` (240ms `ease-out`) for the wash + rim; the pulse
loop runs ~1.9s `ease-in-out` per pass with a staggered second pulse.

## Files changed

- `src/components/viona/local/LocalDynamicHero.tsx` — hover/reduced-motion state, accent-following
  network, wash + rim, pulse wiring.
- `src/components/viona/local/LocalHeroNetworkPulse.tsx` — **new** animated pulse overlay.
- `docs/design/VIONA_WAVE_3B_LOCAL_DYNAMIC_HERO_HOVER_NETWORK_PULSE.md` — this doc.
- Evidence: `…/wave-3b-local-final-hero-assets/local-hero-hover-{resting,active-a,active-b}-1366x768.png`
  + refreshed standard `local-final-hero-assets-*`.

## Hover behavior summary

On hover (web desktop pointer): image brightens very slightly, accent rim glow fades in, static
network boosts, and 1–2 accent pulses travel the lower-right network path. On hover-out everything
returns smoothly (wash + rim ease back to 0; pulses stop). Pulse + network + rim all use the
**current** hero semantic accent:

- default / myRequests → emerald-cyan
- bookingAssist → cyan-blue
- legalWealth → warm gold
- browseServices → violet-magenta

(The accent follows `activeHeroKey`; at rest with no card hovered this is the emerald-cyan default,
so the resting look is unchanged.)

## Reduced-motion / mobile fallback

- **Desktop pointer gate:** hover handlers are attached only when
  `matchMedia('(hover: hover) and (pointer: fine)')` matches, and the pulse `active` is additionally
  gated on that. Touch/mobile never animates — static resting state only.
- **Reduced motion:** `AccessibilityInfo.isReduceMotionEnabled()` (+ live listener). When enabled,
  `LocalHeroNetworkPulse` renders nothing (no traveling pulse); the subtle wash + rim + network-boost
  opacity changes still apply, so hover stays gentle without motion.

## Handler preservation

No routes/handlers/hero-asset-registry semantics changed. `onBrowseServices` / `onBookingAssist`
CTAs, the crossfade, image fit/aspect/objectPosition, and the crisp 1px frame are all intact. Hover
overlays are `pointerEvents: none` and never intercept the CTAs.

## Safety

No payment/wallet/AI/SOS/backend/auth/classifieds/business logic touched. Home not changed. No
horizontal overflow or layout shift (transform/opacity-only overlays inside the existing frame).

## Screenshot QA

`local-hero-hover-resting` vs `active-a` / `active-b` (1366×768): rim glow + slight lift visible on
hover; the pulse dot appears at different positions across the two active frames, confirming it
travels along the network path. Standard 5-viewport captures remain premium and unaffected at rest.
