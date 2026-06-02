# VIONA Wave 3B — Local Dedicated Micro-Scene Asset System

Pack: `VIONA.WAVE_3B.LOCAL_DEDICATED_MICRO_SCENE_ASSET_SYSTEM.1`
**Status:** Archival prep spec — asset registry and PNG slots **not wired to production** on `master` (Pack 49).

## Why not procedural JSX forever

Code-drawn SVG micro-scenes (`LocalFlagshipMicroScene`, `LocalVectorMicroScene`, lab `MyRequestsHeroScene`) are useful as **fallback** and iteration aids. They do not reliably reach reference-grade luminance, mesh density, and icon integration. **Final** Local flagship visuals will be **dedicated transparent SVG/PNG assets** authored outside the app.

## Asset folder

`assets/viona/reference/local/flagships/`

| Registry key | Expected files |
|--------------|----------------|
| `myRequests` | `my-requests-scene.png` / `.svg` |
| `bookingAssist` | `booking-assist-scene.png` / `.svg` |
| `legalWealth` | `legal-wealth-scene.png` / `.svg` |
| `communityServices` | `community-services-scene.png` / `.svg` |

## Naming rules

- Lowercase kebab-case: `{feature}-scene.{png|svg}`
- **Textless** — no baked titles, CTAs, or status copy in artwork
- **Transparent** background (alpha channel required for PNG)
- Version in filename only when replacing: optional `-v2` suffix (update registry require)

## SVG vs PNG

| Format | Guidance |
|--------|----------|
| **PNG** | **Primary for React Native** — uncomment `require()` in `vionaLocalFlagshipSceneAssets.ts` |
| **SVG** | Design source / web; convert to PNG for Metro unless project adds SVG transformer |

## Semantic color

- Color lives in **border, glow, rim, platform** — not milky card-body fills
- Asset artwork should be neutral-to-emerald (per card) luminous objects; card shell supplies semantic edge
- Registry `accent` drives platform glow and shadow when asset is shown

## Code map

| Piece | File |
|-------|------|
| Registry | `src/design/vionaLocalFlagshipSceneAssets.ts` |
| Renderer | `src/components/viona/local/LocalFlagshipSceneAssetLayer.tsx` |
| Lab wiring | `src/components/viona/reference/VionaReferenceSingleCardLab.tsx` |

## How to add an asset

1. Export transparent PNG (recommended 400×280+ @2x) to `assets/viona/reference/local/flagships/`
2. Uncomment matching line in `LOCAL_FLAGSHIP_SCENE_PNG_SOURCES` inside `vionaLocalFlagshipSceneAssets.ts`
3. Restart Metro / Expo
4. Re-run `node scripts/capture-viona-dedicated-micro-scene-asset-system.mjs`
5. Lab legend should switch from fallback message to `Asset: my-requests-scene.png`

## Fallback behavior

1. If PNG `require()` is registered → `LocalFlagshipSceneAssetLayer` renders image + platform glow + mesh veil
2. Else if `fallback` prop passed (lab: `MyRequestsHeroScene`) → render fallback
3. Else → `LocalFlagshipMicroScene` or `LocalVectorMicroScene` via registry `fallbackSceneKey`

**Build never fails** when files are missing — requires stay commented until assets land.

## Safety (artwork must NOT imply)

- paid / settled / payout / escrow
- guaranteed booking / fake merchant accepted
- payment success / fake emergency dispatch / fake AI fulfillment

### Per flagship

| Card | Allowed | Forbidden |
|------|---------|-----------|
| **My Requests** | Request-status check marker | Payment confirmation |
| **Booking Assist** | Draft slot / calendar | Confirmation / success check |
| **Legal & Wealth** | Scales / document / shield | Coin / money / payout / escrow |
| **Community Services** | Map pulse / community nodes | Merchant-paid / event ticket sold |

## Lab capture

Route: `/viona-reference-single-card-my-requests`
Env: `EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB=true`

Evidence: `docs/design/evidence/wave-3b-local-dedicated-micro-scene-asset-system/`

## Production

**Not wired** to `LocalScreen`, `PremiumAppTile`, or `LocalCommandCenterPanel` in this pack.
