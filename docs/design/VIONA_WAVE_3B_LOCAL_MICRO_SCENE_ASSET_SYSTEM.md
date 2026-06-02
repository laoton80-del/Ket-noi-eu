# VIONA Wave 3B — Local Micro-Scene Asset System

**Pack:** `VIONA.WAVE_3B.LOCAL_MICRO_SCENE_ASSET_SYSTEM.1`
**Status:** **READY FOR VISUAL REVIEW** — registry + wiring; **NOT COMMITTED**
**Baseline:** `5d68179` (background registry) + `6e52d50` (card hierarchy)
**Date (UTC):** 2026-05-25

---

## Goal

Prepare typed Local micro-scene PNG support so Local can become the golden visual reference for all VIONA universes. Visual layers only — no fake production states, no business-logic changes.

## Asset folder

`assets/viona/micro-scenes/local/`

| Key | Filename | Semantics (textless art) |
|-----|----------|--------------------------|
| `local-hero-service-network` | `local-hero-service-network-v1.png` | Hero — browse / find local services |
| `local-booking-calendar-beam` | `local-booking-calendar-beam-v1.png` | Booking assist / send request |
| `local-language-bridge` | `local-language-bridge-v1.png` | Language help |
| `local-paperwork-documents` | `local-paperwork-documents-v1.png` | Documents / admin / legal helper |
| `local-merchant-storefront` | `local-merchant-storefront-v1.png` | Vietnamese merchant discovery |
| `local-community-map-pulse` | `local-community-map-pulse-v1.png` | Nearby community / map pulse |
| `local-request-status-path` | `local-request-status-path-v1.png` | Request status / review path |
| `local-no-payment-shield` | `local-no-payment-shield-v1.png` | Request-only / no payment captured |

**On disk (pack 1):** folder + `.gitkeep` only — **0 PNGs imported**. No placeholder images generated in code.

## Registry (`src/design/vionaMicroSceneAssets.ts`)

| API | Purpose |
|-----|---------|
| `getVionaMicroSceneImageSource(key)` | `ImageSourcePropType \| null` — primary safe resolver |
| `getVionaMicroSceneAsset(key)` | `{ key, filename, source } \| null` — metadata + source |
| `listMissingVionaMicroSceneAssets()` | Keys awaiting PNG + `require()` activation |
| `resolveLocalHubMicroSceneKey(testID)` | Local hub tile → registry key |
| `VIONA_MICRO_SCENE_FILENAMES` | Expected filenames |

**Activation:** uncomment the matching static `require()` in `LOCAL_MICRO_SCENE_SOURCES` when each PNG lands. Metro must resolve the file at bundle time.

**Safety:** never throws; no dynamic require paths; missing asset → null (no crash, no placeholder art).

## Rendering law

- Micro-scenes are **visual layers only** inside premium tiles.
- **No text**, buttons, status chips, or UI chrome baked into PNGs.
- **No payment claim** — no paid / settled / payout / escrow / guaranteed booking imagery.
- **No SOS dispatch** or rescue-guarantee implication in art.
- **No logic replacement** — title, status chip, subtitle, and handlers remain real code.
- When `getVionaMicroSceneImageSource` returns null: **render no PNG layer**; existing vector `microScene` on the tile is unchanged.
- PNG layer: low opacity, bottom/right slot, dark veil — text must stay readable.

## Safety law (product copy — unchanged by this pack)

Local money surfaces must keep: **REQUEST-ONLY**, **NO CHARGE**, **NO PAYMENT CAPTURED**, **CONFIRMED ≠ PAID**. This pack does not alter i18n, handlers, or request/no-charge flow.

## Next import / wire step

1. Drop approved textless PNGs into `assets/viona/micro-scenes/local/` using filenames above.
2. Uncomment the matching `require()` line per key in `LOCAL_MICRO_SCENE_SOURCES`.
3. Re-run `node scripts/capture-local-micro-scene.mjs` (optional QA).
4. Commit in a dedicated pack after visual sign-off.

## Tile wiring (Local only)

`PremiumAppTile` accepts optional `microSceneKey` (PNG) + `microScene` (vector fallback).

`VionaMicroSceneImageLayer` — bottom/right slot, low opacity, dark veil over art.

| testID | microSceneKey | Vector fallback |
|--------|---------------|-----------------|
| `local-cta-browse-services` | `local-hero-service-network` | `marketplace-grid` |
| `local-cta-booking-assist` | `local-booking-calendar-beam` | `chat-request-beam` |
| `local-tile-restaurant` | `local-merchant-storefront` | `dining-arc` |
| `local-tile-transit` | `local-language-bridge` | `route-lines` |
| `local-tile-legal-wealth` | `local-paperwork-documents` | `data-doc-matrix` |
| `local-tile-my-requests` | `local-request-status-path` | `timeline-pulse` |
| `local-tile-events` | `local-community-map-pulse` | `social-nodes` |
| `local-tile-legal-scanner` | `local-no-payment-shield` | `scan-rings` |

Other Local tiles keep vector `microScene` only until a future key map is approved.

## Screenshot QA

**Capture:** `npx expo start --web --port 8088 --clear` → `node scripts/capture-local-micro-scene.mjs`

**Evidence:** `docs/design/evidence/wave-3b-local-micro-scene/`

Until PNGs import, captures validate hierarchy + vector fallbacks (PNG layer null).

## Out of scope

- Background registry / `PremiumAppShell` changes
- Travel / Academy / Business / Account / SOS UI
- Routes, wallet, AI, SOS logic, i18n, request/no-charge handlers
- Fake PNG placeholders

## Commit gate

**NOT COMMITTED** — await visual sign-off after approved PNG batch import.
