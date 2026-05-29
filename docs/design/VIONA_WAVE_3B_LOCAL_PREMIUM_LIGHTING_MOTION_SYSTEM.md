# VIONA.WAVE_3B.LOCAL_PREMIUM_LIGHTING_MOTION_SYSTEM.1

The consolidated, controlled Local premium lighting/motion system. It is tiered so the page reads as
one intelligent, connected surface without becoming noisy — each surface gets only as much
light/motion as its role warrants.

## Design hierarchy (strongest → lightest)

| Surface | Treatment |
| --- | --- |
| Dynamic hero | Strongest: hover image lift + accent rim glow + boosted network + traveling semantic pulse |
| 4 opening hero cards | Medium: Home-like edge-lit material, semantic inner rim, hover lift/glow, boosted network |
| Classifieds featured cards | Light: category-semantic network accent (`classified` tier), no hover lift |
| Local For You pills | Utility: clean resting rim; subtle hover/focus rim + icon glow only (no network, no pulse) |
| Merchant / Connected secondary cards | Secondary: readable fill + visible border, soft hover/focus border clarity + depth (no network) |

Shared cheap helper: `LocalLightingNetworkEdge` (SVG lines + glow nodes + corner glow,
`pointerEvents: none`, self-clipped to radius, tiered `hero`/`card`/`classified`, semantic accent,
`boosted` hover). Used on hero + hero cards + classifieds only — never on pills or secondary cards.

## A. Dynamic hero hover network pulse (`LocalDynamicHero` + `LocalHeroNetworkPulse`)

Layered overlays inside the existing frame (raster image never animated):
- image-brighten wash (`opacity 0 → 0.05`, image-only, below copy)
- accent rim glow (`opacity 0 → 0.6`, above the crisp 1px frame)
- static `LocalLightingNetworkEdge` (`tier="hero"`), `boosted` on hover
- `LocalHeroNetworkPulse`: 1–2 accent dots interpolated across the network polyline vertices (~1.9s
  ease-in-out, staggered), transform + opacity on the native driver.

Accent follows the active hero: default/myRequests emerald-cyan, bookingAssist cyan-blue, legalWealth
gold, browseServices violet-magenta. Hover gated to web desktop pointer
(`matchMedia('(hover: hover) and (pointer: fine)')`); reduced-motion removes the pulse and keeps only
the wash/rim/network-boost. Image fit/aspect/objectPosition and the crisp frame are unchanged — no
layout shift, no reintroduced zoom/crop.

## B. Four opening hero cards (`LocalHomeParityCard`)

Home world-card grammar on web: `fashionHomeWebDaylightWorldCardMaterialStyle` +
`...InnerRimStyle` + `...HostHoverMotionStyle` + persistent `...TransitionStyle`, corner-lit + bottom
veil glass layers, and a `card`-tier `LocalLightingNetworkEdge` that `boosted`s on hover. Hover
(driven by `edgeLitHoverBoost` from the row's `hoveredHeroKey`) sharpens the semantic rim, lifts
depth/glow, and brightens the network. Semantic accents emerald/cyan, cyan/blue, gold/amber,
violet/magenta. Host clip + rim share `radius.lg` → one crisp edge, no double border / broken corner.

## C. Classifieds featured preview (`LocalClassifiedsFeaturedPreview`)

Renders through `LocalHomeParityCard` with `networkTier="classified"` (lighter than hero cards) and a
category-resolved accent (jobs/nails → emerald, shop/business transfer → gold, housing → cyan,
services → emerald, community → violet). Preview cap, Create Listing / View All handlers, VIP
pilot/demo honesty, and the even 3-up grid are all unchanged.

## D. Local For You pills (`LocalQuickActionsRow`)

Utility tier — **not** decorated heavily. Resting keeps the existing clean accent rim. On hover/focus
only: rim sharpens (`tone ea → ff`), the semantic glow grows slightly (`shadowRadius 3 → 6`), and a
small icon-chip glow appears. A 160ms web transition keeps it smooth. No network lines, no traveling
pulse, no layout/scale/grid change. Icon + text stay fully readable.

## E. Secondary merchant / connected cards (`LocalMerchantToolsSection`, `LocalConnectedUniverseLinks`)

Stay secondary but clearly clickable: lighter elevated slate fill (`rgba(30,43,64,0.78)`), visible
border (`0.6`), near-white title, muted-readable subtitle, soft normal-depth shadow. Hover/focus adds
border clarity + a soft cool glow. No photo treatment, no network, no animation, no hero-level glow.

## F. Reduced-motion / mobile

- Hover effects (hero + pulse) are gated to web desktop pointer; touch/mobile renders the static
  resting state.
- `AccessibilityInfo.isReduceMotionEnabled()` (+ live listener): the traveling pulse is disabled;
  the subtle wash/rim/network-boost opacity changes remain.
- Pills/cards use opacity/glow/border state changes (or short ease transitions) only — no traveling
  motion.

## G. Preserved

Hero image fit/aspect/objectPosition, page width alignment, continuous premium background, Local For
You scale/grid, classifieds preview cap, request-only / no-payment safety copy, B2C/B2B separation,
and SOS safety behavior are all unchanged. No routes/handlers/business logic touched; no images
replaced; Home not modified.

## Files in the system

`LocalDynamicHero.tsx`, `LocalHeroNetworkPulse.tsx`, `LocalHeroCardsRow.tsx`, `LocalHomeParityCard.tsx`,
`LocalLightingNetworkEdge.tsx`, `LocalClassifiedsFeaturedPreview.tsx`, `LocalQuickActionsRow.tsx`,
`LocalMerchantToolsSection.tsx`, `LocalConnectedUniverseLinks.tsx`. This pack's change: section D
(pills hover/focus rim + icon glow); the other tiers were delivered in the preceding Wave 3B packs.

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/` — standard `local-final-hero-assets-*`,
hero hover frames `local-hero-hover-*`, classifieds grid `local-classifieds-grid-*`, and the For You
pill hover proof `local-for-you-pill-hover-*`.
