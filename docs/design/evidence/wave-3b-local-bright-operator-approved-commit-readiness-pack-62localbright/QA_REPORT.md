# QA Report — Pack 62LOCALBRIGHT_COMMIT_READY

**Pack:** `VIONA.WAVE_3B.LOCAL_BRIGHT_OPERATOR_APPROVED_COMMIT_READINESS.PACK_62LOCALBRIGHT_COMMIT_READY`
**Date:** 2026-06-08
**Status:** Commit-readiness prepared — **no stage, no commit, no push**

---

## 1. Safe commit scope

Scoped **Local Bright operator-approved** commit only:

- Operator-approved live PNG assets (9)
- Operator-approved staging folder + manifest
- Governance evidence (approve + commit-readiness)
- Approval QA script
- Required Local Bright runtime wiring (hero, focal, copy, full-bleed, text readability, card hover network)

**Does not include** Travel hover network, Home audit, i18n locale JSON, payment/auth/booking/SOS, or unrelated Local experiments.

---

## 2. Runtime files proposed

| File | Status | Reason |
|------|--------|--------|
| `src/components/viona/local/LocalDynamicHero.tsx` | Modified | Web-normal hero, fullBleedCover, hover switch, text scrim |
| `src/components/viona/local/localDynamicHeroAssets.ts` | Modified | 62localbright master require map + focal ladder |
| `src/components/viona/local/localBrightHeroCopyMap.ts` | **New** | Hover copy switching (Vietnamese, in-file) |
| `src/components/viona/local/localBrightHeroDisplayMode.ts` | **New** | Full-bleed cover fit resolver |
| `src/components/viona/local/LocalHomeParityCard.tsx` | Modified | Card hover network border + lighting parity |
| `src/components/viona/local/LocalLightingNetworkEdge.tsx` | Modified | Visible card-tier network on hover |
| `src/components/viona/VionaDynamicHeroWebNormalClean.tsx` | **New** | Web-normal clean hero renderer + left text scrim |
| `src/components/viona/dynamicHeroMediaFit.ts` | Modified | Shared hero media fit helpers (required by LocalDynamicHero) |
| `src/design/vionaLocalHeroAssets.ts` | Modified | 62localbright card image requires |
| `src/design/vionaLocalHeroVisuals.ts` | Modified | Focal objectPosition alignment |
| `src/design/vionaLocalBrightRealCityFit.ts` | **New** | Full-bleed fit constants for display mode |

**Shared-file note:** `dynamicHeroMediaFit.ts` and `VionaDynamicHeroWebNormalClean.tsx` are also consumed by Travel runtime, but **TravelScreen / travel assets are excluded** from this commit. Changes are additive shared infrastructure; current tree typechecks and smokes clean.

---

## 3. Asset files proposed

**Live (9):** `assets/viona/dynamic-hero/local/`

| File | Dimensions | SHA256 (prefix) |
|------|------------|-----------------|
| `local-overview-web-normal-master-62localbright.png` | 2590×607 | `9d1afd88…` |
| `local-my-requests-web-normal-master-62localbright.png` | 2590×607 | `b020095f…` |
| `local-booking-assist-web-normal-master-62localbright.png` | 2590×607 | `8b57e9bd…` |
| `local-legal-wealth-web-normal-master-62localbright.png` | 2590×607 | `79d28da4…` |
| `local-browse-services-web-normal-master-62localbright.png` | 2590×607 | `e95d1656…` |
| `local-my-requests-web-normal-card-62localbright.png` | 1672×941 | `4e9a43fe…` |
| `local-booking-assist-web-normal-card-62localbright.png` | 1672×941 | `3bf0647b…` |
| `local-legal-wealth-web-normal-card-62localbright.png` | 1672×941 | `26d0bb94…` |
| `local-browse-services-web-normal-card-62localbright.png` | 1672×941 | `56d26b4a…` |

**Staging:** `assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_operator-approved-visual-set-62localbright/` (9 PNGs + `APPROVAL_MANIFEST.md`)

**Verification:** `liveMatchesApproved: true`, `mastersVerified: true`, `cardsVerified: true` (operator-approved script).

---

## 4. Evidence / scripts proposed

| Path | Purpose |
|------|---------|
| `docs/design/evidence/wave-3b-local-bright-operator-approved-visual-set-pack-62localbright/` | Operator approval governance |
| `docs/design/evidence/wave-3b-local-bright-operator-approved-commit-readiness-pack-62localbright/` | This commit-readiness doc |
| `scripts/operator-approved-visual-set-pack-62localbright.mjs` | Verify + QA capture script |

**Optional audit chain (not in commit scope):** `wave-3b-local-bright-superseded-ab-preview-pack-62localbright/` — keep locally, omit from first commit unless operator wants full chain.

---

## 5. Explicit exclusions

| Category | Exclude |
|----------|---------|
| **Travel** | `TravelScreen.tsx`, `TravelAppTile.tsx`, `TravelCardLightingNetwork.tsx`, `travelCardNetworkSemantic.ts`, `travelDynamicHeroAssets.ts`, travel assets |
| **Home / shared experiments** | `PremiumAppTile.tsx`, `PremiumTileMicroScene.tsx`, `VionaFashionWorldCard.tsx`, `design/index.ts`, micro-scene / card-artwork layers |
| **i18n** | `src/i18n/locales/*.json` (hover copy is in `localBrightHeroCopyMap.ts`) |
| **Rollback / superseded** | `local/_backup-before-superseded-ab-preview-62localbright/`, `_superseded-semantic-fail-do-not-wire/` |
| **Experiment assets** | `*-62x.png`, `*-62y.png`, `*-62z.png`, `*-source*.png`, `*-2400x832.png`, untracked incoming folders |
| **Stray** | `$null` |
| **Unrelated Local experiments** | `LocalFlagshipMicroScene.tsx`, `LocalVectorMicroScene.tsx`, `LocalCommandCenterPanel.tsx`, `vionaMicroSceneAssets.ts`, `vionaLocalCardArtworkAssets.ts`, etc. |
| **Other evidence packs** | All other `wave-3b-*` folders except the two listed above |
| **Other scripts** | `superseded-ab-preview-pack-62localbright.mjs`, capture/audit experiment scripts |

---

## 6. Semantic override status

Documented in:

`docs/design/evidence/wave-3b-local-bright-operator-approved-visual-set-pack-62localbright/semantic-operator-override.md`

- Previous: `_superseded-semantic-fail-do-not-wire`
- Operator decision: **WARN override** (not blocker) for this visual set
- No fake production / payment / auth / booking / SOS / route impact

---

## 7. Validation results

| Gate | Result |
|------|--------|
| `git status -sb` | `master...origin/master [ahead 29]` — many unrelated dirty files |
| `git diff --stat` (whole tree) | 21 files, +2503/−762 (includes Travel — **excluded from commit**) |
| `git diff --check` | PASS (LF warnings only) |
| `npx tsc --noEmit` | PASS |
| `npm run smoke` | PASS |
| Conflict marker grep | PASS (none) |

### Runtime behavior verified (operator-approved QA captures)

| Check | Result |
|-------|--------|
| Hover image switching | PASS — `activeHeroKey` switches per tile |
| Hover copy switching | PASS — `heroCopyKey` + Vietnamese titles |
| `heroDisplayMode` | `fullBleedCover` |
| Editorial inset | Not active |
| Text readability | Left scrim + multi-layer shadows active |

---

## 8. Risk assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Unrelated dirty files in working tree | **High** | Use exact `git add` list below — never `git add -A` |
| Shared hero files (`dynamicHeroMediaFit`, `VionaDynamicHeroWebNormalClean`) | **Medium** | Travel consumes same modules; commit without Travel changes is still typecheck-clean; follow with separate Travel commit |
| Semantic WARN override | **Low** | Documented operator override; no production-claim impact |
| Large PNG binary commit | **Low** | Expected; 9 files ~20 MB total |
| Backup/superseded folders omitted | **Low** | Retained on disk for rollback; documented in `restore-plan.md` |

---

## 9. SAFE_TO_COMMIT_LOCAL_BRIGHT_OPERATOR_APPROVED

**YES** — with **scoped** `git add` only (not stage yet per pack instructions).

---

## 10. Exact safe `git add` list (if YES)

```bash
# Live operator-approved assets (9)
git add assets/viona/dynamic-hero/local/local-overview-web-normal-master-62localbright.png
git add assets/viona/dynamic-hero/local/local-my-requests-web-normal-master-62localbright.png
git add assets/viona/dynamic-hero/local/local-booking-assist-web-normal-master-62localbright.png
git add assets/viona/dynamic-hero/local/local-legal-wealth-web-normal-master-62localbright.png
git add assets/viona/dynamic-hero/local/local-browse-services-web-normal-master-62localbright.png
git add assets/viona/dynamic-hero/local/local-my-requests-web-normal-card-62localbright.png
git add assets/viona/dynamic-hero/local/local-booking-assist-web-normal-card-62localbright.png
git add assets/viona/dynamic-hero/local/local-legal-wealth-web-normal-card-62localbright.png
git add assets/viona/dynamic-hero/local/local-browse-services-web-normal-card-62localbright.png

# Operator-approved staging + manifest
git add assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_operator-approved-visual-set-62localbright/

# Governance evidence
git add docs/design/evidence/wave-3b-local-bright-operator-approved-visual-set-pack-62localbright/
git add docs/design/evidence/wave-3b-local-bright-operator-approved-commit-readiness-pack-62localbright/

# QA script
git add scripts/operator-approved-visual-set-pack-62localbright.mjs

# Required Local Bright runtime
git add src/components/viona/local/LocalDynamicHero.tsx
git add src/components/viona/local/localDynamicHeroAssets.ts
git add src/components/viona/local/localBrightHeroCopyMap.ts
git add src/components/viona/local/localBrightHeroDisplayMode.ts
git add src/components/viona/local/LocalHomeParityCard.tsx
git add src/components/viona/local/LocalLightingNetworkEdge.tsx
git add src/components/viona/VionaDynamicHeroWebNormalClean.tsx
git add src/components/viona/dynamicHeroMediaFit.ts
git add src/design/vionaLocalHeroAssets.ts
git add src/design/vionaLocalHeroVisuals.ts
git add src/design/vionaLocalBrightRealCityFit.ts
```

**Suggested commit message (when operator requests commit):**

```
Promote operator-approved Local Bright 62localbright visual set.

Wire full-bleed web-normal heroes, hover copy, card artwork, and governance evidence. Semantic auto-fail downgraded to operator WARN override.
```

---

## 11. No commit

Confirmed — this pack does **not** commit.

## 12. No push

Confirmed — this pack does **not** push.
