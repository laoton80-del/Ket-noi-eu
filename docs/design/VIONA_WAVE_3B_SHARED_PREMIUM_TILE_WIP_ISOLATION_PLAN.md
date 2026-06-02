# VIONA Wave 3B — Shared PremiumAppTile WIP Isolation Plan

**Pack ID:** `VIONA.WAVE_3B.SHARED_PREMIUM_TILE_LOCAL_GRAMMAR_ISOLATION_PLAN.51`
**Status:** Plan only — **no runtime change** in this pack
**Baseline:** `8eb6ba3` (Travel Wave 3B + Local Pack 48 runtime + Local Pack 49 archival pushed)
**Prior audit:** `VIONA.WAVE_3B.SHARED_PREMIUM_TILE_GRAMMAR_RISK_AUDIT.PACK_50`

---

## 1. Current status

Shared **PremiumAppTile** reference / Local grammar work exists **only in the local workspace** (modified + untracked files). It is **not safe for production commit** on `master` in its current form.

| State | Detail |
|-------|--------|
| **Modified (uncommitted)** | `PremiumAppTile.tsx`, `PremiumTileMicroScene.tsx`, `design/index.ts`, `premiumTileVisualTokens.ts` |
| **Untracked (required deps)** | Reference glass, vector micro-scenes, card-artwork layers, design registries |
| **Production on `master`** | Pack 48 Local opening stage uses `LocalHomeParityCard`; committed `PremiumAppTile` has no reference-lab imports |
| **This pack** | Documentation only — **zero** `src/` changes |

Do **not** land global `PremiumAppTile` WIP until the isolation strategy below is executed and gates pass.

---

## 2. Blast radius

If the current WIP were committed as-is (or partially), these surfaces would be affected:

| Surface | Uses `PremiumAppTile`? | Risk if global WIP lands |
|---------|------------------------|---------------------------|
| **Local commerce / secondary** | Yes — `LocalCommerceClarityBlock` | Layout/token drift on Local secondary tiles |
| **Account** | Yes — `CaNhanScreen` | Hub tile height, glass, micro-scene bands |
| **Academy** | Yes — `AcademyScreen` | Same |
| **Intent entry** | Yes — `IntentEntryModal` | Modal tile grammar |
| **Emergency hub** | Yes — `EmergencyHubTile` | Safety-adjacent tile presentation (guidance-only today) |
| **Other hub tiles** | Possible via `PremiumTileGrid` / shared viona exports | Any consumer of `PremiumAppTile` or `premiumTileLayout` |

**Clarifications (out of scope for this WIP path):**

| Surface | Relationship to this WIP |
|---------|---------------------------|
| **Home** | Does **not** use `PremiumAppTile` directly today — uses `VionaFashionWorldCard` / world-card grammar |
| **Travel** | Uses separate **`TravelAppTile`** / `TravelGlassCard` — **not** part of this PremiumAppTile WIP; must not be mixed in the same commit train |
| **Local opening hero** | Pack 48 uses **`LocalHomeParityCard`** via `LocalHeroCardsRow` — **not** `PremiumAppTile` |

New WIP props (`fullCardArtworkKey`, `localVectorSceneKey`, `commandCenterFlagship`) have **no production call sites** yet; risk is primarily **global token changes** and **broken partial commits**, not active opt-in usage.

---

## 3. Risk list

| Risk | Severity | Detail |
|------|----------|--------|
| **`PremiumAppTile` alone** | **Critical** | Breaks clean clone — imports untracked `VionaReferenceGlass`, registries, `LocalVectorMicroScene`, artwork layers |
| **`design/index.ts` alone** | **Critical** | Breaks clean clone — re-exports `./vionaMicroSceneAssets` and `./vionaLocalCardArtworkAssets` (untracked) |
| **`premiumTileVisualTokens` alone** | **High** | `minHeightHero` **168 → 220** is **global** — affects all hero-tier `PremiumAppTile` min heights; prominent micro-scene layout constants affect future `prominent={true}` usage |
| **Reference glass / vector / card-artwork** | **High** | Requires design review — command-center reference is not signed off for cross-hub use |
| **Mixing Travel tile WIP** | **Critical** | `TravelAppTile` / `TravelGlassCard` dirty work must **not** be bundled with PremiumAppTile isolation — separate pack, separate QA |
| **Partial asset wiring** | **Medium** | Micro-scene PNG `require()` lines are commented; card artwork `VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED = false` — enabling without assets causes visual gaps or build errors |
| **Fake production claims** | **Protocol** | No booking/payment/dispatch/dispatch semantics in tile visual work — safety chips remain request-only / demo labels |

---

## 4. Minimum safe bundle (if ever committed together)

All of the following must land **in one atomic commit** (or a sequenced PR with no intermediate broken `master`):

| # | File |
|---|------|
| 1 | `src/components/viona/PremiumAppTile.tsx` |
| 2 | `src/components/viona/PremiumTileMicroScene.tsx` |
| 3 | `src/design/index.ts` |
| 4 | `src/design/premiumTileVisualTokens.ts` |
| 5 | `src/components/viona/VionaReferenceGlass.tsx` |
| 6 | `src/components/viona/VionaLocalCardArtworkLayer.tsx` |
| 7 | `src/components/viona/VionaMicroSceneImageLayer.tsx` |
| 8 | `src/components/viona/local/LocalVectorMicroScene.tsx` |
| 9 | `src/components/viona/local/localVectorMicroSceneKeys.ts` |
| 10 | `src/design/vionaMicroSceneAssets.ts` |
| 11 | `src/design/vionaLocalCardArtworkAssets.ts` |
| 12 | `src/design/vionaReferenceVisualTokens.ts` |
| 13 | `src/design/vionaGlassMaterialTokens.ts` (if `VionaReferenceGlass` depends on it) |

**Not included in minimum bundle:** `src/components/viona/reference/*` labs, `LocalCommandCenterPanel.tsx` — keep dev-only until env-gated routes and Phase E integration per `VIONA_WAVE_3B_LOCAL_REFERENCE_PRODUCTION_INTEGRATION_PLAN.md`.

**Flags / defaults at commit time:**

- `VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED = false` until PNGs + review
- `commandCenterFlagship` default **false**
- Micro-scene PNG requires uncommented only when files exist under `assets/viona/micro-scenes/local/`

---

## 5. Preferred strategy

1. **Do not land global `PremiumAppTile` WIP directly** on `master` without isolation.
2. **Split Local reference grammar** into a **Local-only component** (e.g. `LocalReferencePremiumTile` or gated variant) that owns reference glass, vector scenes, and compact flagship layout.
3. **Keep global `PremiumAppTile` stable** for Account, Academy, Emergency, and Local commerce until cross-hub QA is planned and executed.
4. **Enable card artwork / micro-scene production** only after:
   - Assets exist and `require()` paths are verified
   - Flags reviewed (`RENDER_ENABLED`, env gates)
   - Local reference ≥8 gates from archival docs (Pack 49 evidence)
5. **Travel remains separate** — `TravelAppTile` changes follow Travel pack discipline, not this plan.

Reference: `VIONA_WAVE_3B_LOCAL_REFERENCE_PRODUCTION_INTEGRATION_PLAN.md` (Phase E — plan only).

---

## 6. Future pack sequence (proposed)

| Pack | Name (proposed) | Goal |
|------|-----------------|------|
| **52A** | Local-only component extraction **plan/audit** | Map call sites, props, and file split for `LocalReferencePremiumTile` vs `PremiumAppTile` |
| **52B** | Local-only reference tile **behind disabled flag** | Ship Local-scoped component + registries; **no** global `PremiumAppTile` behavior change |
| **53** | Cross-hub `PremiumAppTile` QA | If global token/layout changes still needed — Account, Academy, Emergency, Local commerce, modals |
| **54** | Optional production wiring | Enable flags, assets, and call-site props after visual approval |

Between packs: keep shared tile WIP **dirty locally** or on a feature branch — do not partial-commit to `master`.

---

## 7. Hard gates before any code pack

All must pass before merging shared tile **code** (not this doc):

| Gate | Requirement |
|------|-------------|
| **Clean clone** | `git clone` + `npm install` + `npx tsc --noEmit` — no missing modules from partial commit |
| **No global hub regression** | Visual QA on Account, Academy, Emergency, Local commerce tiles if `premiumTileVisualTokens` changes |
| **No Home / Travel drift** | Home world-cards and Travel tiles unchanged unless explicitly scoped |
| **No fake production** | No implied booking confirmed, payment captured, dispatch, or certification claims |
| **No missing asset `require()`** | Every uncommented micro-scene / artwork path resolves to a file in repo |
| **Typecheck + smoke** | `npx tsc --noEmit`, `npm run smoke` |
| **Targeted QA captures** | If global `PremiumAppTile` changes: Local secondary, Account, Academy, Emergency, Intent modal viewports (390, 768, 1024, 1366) |

---

## 8. Related docs (archived)

- `VIONA_WAVE_3B_LOCAL_REFERENCE_PRODUCTION_INTEGRATION_PLAN.md`
- `VIONA_WAVE_3B_LOCAL_REFERENCE_REPLICA_PANEL.md`
- `VIONA_WAVE_3B_LOCAL_VECTOR_MICRO_SCENE_SYSTEM.md`
- Evidence under `docs/design/evidence/wave-3b-local-*` (Pack 49)

---

**Document type:** Isolation charter — engineering gate before shared tile code promotion.
**Last updated:** Pack 51 (docs only).
