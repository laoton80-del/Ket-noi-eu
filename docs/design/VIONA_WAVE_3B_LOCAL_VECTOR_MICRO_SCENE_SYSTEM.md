# VIONA Wave 3B — Local Vector Micro-Scene System

**Pack:** `VIONA.WAVE_3B.LOCAL_VECTOR_MICRO_SCENE_SYSTEM.1` + premium + reference compact passes  
**Status:** Golden reference for Local hub tiles (code-driven; no raster micro-scenes)

## Problem

AI-generated PNG card art was soft, noisy, and poster-like. The VIONA command-center reference uses **luminous UI cards** with **sharp vector-like neon micro-scenes** in the lower band—not photorealistic backgrounds.

## Solution

Replace Local hub dependence on PNG micro-scenes with **`react-native-svg`** line-art scenes rendered in:

- `src/components/viona/local/LocalVectorMicroScene.tsx`
- Key registry: `src/components/viona/local/localVectorMicroSceneKeys.ts`

Wiring:

- `PremiumAppTile` — `localVectorSceneKey` takes priority over `microSceneKey` / legacy `PremiumTileMicroScene`
- `LocalScreen` — hub tiles pass `localVectorSceneKey={resolveLocalHubVectorSceneKey(testID)}`
- `fullCardArtworkKey` remains for **tier min-heights / glow**; full-card PNG render stays **off** (`VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED = false`)

Connected universe tiles on Local still use legacy `PremiumTileMicroScene` kinds (Travel / Business / Academy).

## Scene keys (15)

| Key | Hub testID | Visual intent |
|-----|------------|---------------|
| `local-browse-services` | `local-cta-browse-services` | Pin + service nodes + curved links |
| `local-booking-assist` | `local-cta-booking-assist` | Calendar + appointment beam + nodes |
| `local-restaurant-services` | `local-tile-restaurant` | Table / dish / storefront + reservation path |
| `local-transit-mobility` | `local-tile-transit` | Vehicle + route + station nodes |
| `local-legal-wealth` | `local-tile-legal-wealth` | Scales + document + shield (no payment) |
| `local-my-requests` | `local-tile-my-requests` | Request path + check + timeline |
| `local-nails-beauty` | `local-tile-nails` | Salon / tools; magenta accent in scene |
| `local-community-events` | `local-tile-events` | People group + stage + violet nodes |
| `local-housing-home` | `local-tile-housing` | Home cluster + map pin |
| `local-classifieds-market` | `local-tile-classifieds` | Board / tag / exchange (no cash-out) |
| `local-document-scanner` | `local-tile-legal-scanner` | Document + scan frame + verification ring |
| `local-request-sent` | (reserved compact) | Smaller, lower intensity |
| `local-merchant-review` | (reserved compact) | Smaller, lower intensity |
| `local-merchant-declined` | (reserved compact) | Smaller, lower intensity |
| `local-confirmed-not-paid` | (reserved compact) | **CONFIRMED ≠ PAID** — no fake success |

Compact status keys are implemented for future status tiles; the compact legend strip remains copy-only.

## Reference compact card pass

Command-center proportions in `PremiumAppTile` when Local vector art direction is active:

| Tier | Mobile height | Wide (≥768) | Desktop hero |
|------|---------------|-------------|--------------|
| Hero | 182px | 192px | 202px |
| Primary | 136px | 142px | — |
| Secondary | 126px | 130px | — |

- Shell: **1.25–1.5px** neon border, tighter halo, visible inner rim, darker glass fill
- Scene slot: **lower-right** band (hero 52%, primary 50%, secondary 48% of card)
- Hero row wide: Browse **60%**, Booking assist **40%**
- Scenes: `xMaxYMax` anchor, fill slot ~94–100%, `SceneStage` scale bias

Evidence: `docs/design/evidence/wave-3b-local-reference-compact-card-pass/`

## Premium pass (icon-scenes)

**Scale tiers** (canvas + slot, derived from artwork tier / `size`):

| Tier | Card footprint target | Canvas (approx.) | Slot height |
|------|----------------------|------------------|-------------|
| Hero | 45–55% | 228×148 | 56%, min 108px |
| Primary | 40–50% | 204×132 | 52%, min 94px |
| Secondary | 35–45% | 180×116 | 46%, min 84px |
| Compact status | lower intensity | 126×72 | reserved |

**Staging per scene:** luminous platform ellipse, dual-layer glow orb, 2–4 node dots, 1–3 connection arcs, depth arc, foreground hero object.

**Stroke stack:** dim glow stroke → bright core → white/cyan highlight (no hairline-only paths).

## Visual rules

- Semantic strokes from `premiumUniverseAccentSpec(accent)` on each tile
- Soft glow orbs at low opacity only—no raster texture
- **Prominent** band when `shouldUseLocalLuminousMicroSceneArtDirection(fullCardArtworkKey)`
- Text-safe top veil + upper-left copy unchanged; no SVG text

## Safety copy (unchanged)

- REQUEST-ONLY  
- NO CHARGE  
- NO PAYMENT CAPTURED  
- CONFIRMED ≠ PAID  

## QA capture

```bash
npx expo start --web --port 8088
node scripts/capture-local-reference-compact-card-pass.mjs
```

Evidence (reference compact): `docs/design/evidence/wave-3b-local-reference-compact-card-pass/`  
Sharpness pass: `docs/design/evidence/wave-3b-local-vector-sharpness-pass/`  
Premium pass: `docs/design/evidence/wave-3b-local-vector-micro-scene-premium/`  
Baseline: `docs/design/evidence/wave-3b-local-vector-micro-scene/`

## Final reference pass

- Scene anchor: `xMidYMax` + centered slot (`left` 22–26%, `right` 10)
- Scale: ~**+18%** via bottom-centered transform
- `IntegratedBackdrop`: hero glow orb + strengthened platform
- Strokes: tighter outer glow, **vividStroke/vividInk** (hover tokens) on key objects
- Capture: `node scripts/capture-local-vector-final-reference-pass.mjs`

## Sharpness pass (luminous mini-worlds)

- Layered strokes: glow halo + core + white highlight (higher opacity)
- Stronger platform double-ellipse + hero glow orbs
- Per-scene semantic pairs (e.g. browse emerald+cyan, booking cyan+emerald, transit cyan+blue route)
- Denser nodes/arcs; `SceneStage` scale ~1.1; thicker stroke weights
- Capture: `node scripts/capture-local-vector-sharpness-pass.mjs`

Viewports: 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Out of scope

Routes, wallet/payment, API, auth, AI, SOS, other universes, i18n, background assets, Local request/no-charge logic.
