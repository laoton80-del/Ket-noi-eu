# Travel master hero frame — static code audit

**Pack:** `PACK_TRAVEL_MASTER_FRAME_AUDIT_ALL_VISIBLE_AND_HIDDEN`
**Branch audited:** `viona/travel-multi-scene-restore` @ `05cfb19` (code); runtime DOM on `viona/travel-active-layer-stacked-qa` (RefLab gate for `/travel`)
**Date:** 2026-06-12

## Primary files (Travel hero / image frame logic)

| File | Role |
| --- | --- |
| `src/screens/b2c/TravelScreen.tsx` | Hero stage metrics, aspect ratio, cover dezoom, active overlay, flagship card images, fullscreen opening stage |
| `src/components/travel/TravelHeroLightingNetwork.tsx` | Hover lighting network layer (full hero bounds) |
| `src/components/travel/TravelAppTile.tsx` | Quick Help / utility tile shell; flagship card min heights |
| `src/components/travel/TravelGlassCard.tsx` | Hero / flagship glass frame, rim, wash multipliers |
| `src/components/travel/travelHeroSemanticLighting.ts` | Route arcs, subject glow, network colors |
| `src/components/viona/useMiniAppShellChrome.ts` | Browser fullscreen toggle (web desktop) |
| `src/hooks/useFullscreenMode.ts` | Document fullscreen API |
| `src/components/viona/fashionHomeDesktopShell.ts` | Shared opening-stage card min height (`180px`) |

## Code constants (visible + hidden frame drivers)

| Constant | Value | Effect |
| --- | --- | --- |
| `TRAVEL_HERO_ASPECT` | `1600/648` ≈ **2.469** | CSS `aspectRatio` on hero stage (all breakpoints) |
| `TRAVEL_WEB_HERO_MIN_PX` | 360 | Desktop hero min height |
| `TRAVEL_WEB_HERO_MAX_PX` | 600 | Desktop hero max height (+ label bonus) |
| `TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_TARGET_PX` | **410** | Normal desktop target hero height |
| `TRAVEL_OPENING_STAGE_FULLSCREEN_WEB_HERO_TARGET_PX` | **376** | Fullscreen desktop target hero height |
| `TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH` | 1024 | Desktop web hero grammar threshold |
| `TRAVEL_HERO_LARGE_DESKTOP_MIN_WIDTH` | 1366 | Large desktop editorial title preset |
| `TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_NORMAL` | **0.72** | Default master web dezoom (≈139% raster) |
| `TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_FULLSCREEN` | **0.70** | Fullscreen dezoom |
| Alt overlay art direction | coverScale **0.32–0.36** | Active overlay dezoom (translation/rides/emergency) |
| `FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX` | **180** | Quick Help flagship card min height (desktop) |

## Wired dynamic-hero assets (`TravelScreen.tsx`)

| Slot | File | Hero key / card |
| --- | --- | --- |
| Default / journey master | `travel-airport-web-normal-master-62h.png` | `default`, `journey` |
| Translation overlay | `travel-translation-assist-web-normal-source.png` | `interpreter` |
| Rides overlay | `travel-rides-assist-web-normal-source.png` | `rides` |
| Emergency overlay | `travel-emergency-police-web-normal-source.png` | `emergencyPolice` |
| Quick Help cards (62y) | `travel-*-web-normal-card-62y.png` | flagship tiles |

## Hidden / fullscreen frame path

- `openingStageFullscreen = desktopWeb && isFullscreen` (`useFullscreenMode` + width ≥ 1024).
- `computeTravelOpeningStageFirstViewLock()` locks hero max to **376px** target in fullscreen (vs **410px** normal).
- Fullscreen uses lower cover scale (0.70), tighter text veil (50%), reduced padding.
- **No separate fullscreen PNG** wired at runtime; `travel-airport-web-normal-fullscreen-look-62e.png` exists on disk only.
- Fullscreen is **browser document fullscreen** via shell chrome (`useMiniAppShellChrome`), not a separate route.

## Responsive hero metrics summary (`travelDynamicHeroMetrics`)

| Breakpoint | stageMin–Max (px) | Notes |
| --- | --- | --- |
| Desktop web (≥1024, landscape) | 360–632 | Height target **410** normal; aspectRatio **2.469** applied then height cap wins → **measured ~3.25:1** at 1366×768 |
| Tablet 768–1023 | 320–432 | `objectPosition` 62% 40% |
| Mobile &lt;768 | 300–428 | Compact hero path |
| Compact landscape (w/h &gt; 1.8) | 268–392 | Short viewport |

## Card / tile image framing

- Flagship cards: `travelFlagshipCardWebImageStyle` → `objectFit: cover`, per-scenario `objectPosition` (~54–56% X).
- Cards use **same 2172×724** assets as masters (different files, same dimensions).
- Utility pills: icon-only (no full master reuse).

## Key finding (static)

Travel’s **coded** aspect ratio is **2.469:1**, but **desktop height lock (410px)** on a ~1334px-wide shell produces an **effective visible clip ~3.25:1**. This diverges from Local Bright’s **2590×607 (~4.27:1)** ultra-wide masters documented in Local packs.
