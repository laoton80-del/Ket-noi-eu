# VIONA kernel handoff — after Travel #55 and Local salvage

**Document type:** Session handoff snapshot for ChatGPT / Cursor agents and operators.
**Audience:** AI coding agents, release train owners, Local/Travel mini-app owners.
**Subordinate to:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` and Master Blueprint.

**Generated:** 2026-06-12
**Pack:** `PACK_VIONA_KERNEL_HANDOFF_AFTER_TRAVEL55_AND_LOCAL_SALVAGE`

---

## 1. Current baseline

| Item | Value |
|------|--------|
| **origin/master** | `0becdfa` — `feat(travel): restore multi-scene location master heroes (#55)` |
| **Clean master worktree** | `c:\KNG\ket-noi-eu-master-sync` (branch from `origin/master` or detached @ `0becdfa`) |
| **Main repo (parked WIP)** | `c:\KNG\ket-noi-eu` on `viona/visual-tile-wip-isolate` — **do not code here** |

### Completed PRs on master

| PR | Commit | Summary |
|----|--------|---------|
| ReferenceLab gate fix | `1979b99` | `getReferenceLabStackScreens(Stack)` — no invalid `<ReferenceLabStackScreensGate />` navigator child |
| Visual Tile #54 | `3766063` | Premium tile micro-scene isolation (`PremiumAppTile`, vector micro-scenes) |
| Travel Location Master V2 #55 | `0becdfa` | Multi-scene Travel heroes (airport / Prague / Paris / Berlin), hero-only wiring, Quick Help cards, responsive crop |

### Verified gates (last full master sync @ `0becdfa`)

- `git diff --check` — PASS
- `node scripts/viona-forbidden-claims-check.mjs` — PASS (default + strict)
- `node scripts/viona-ai-safety-readiness-check.mjs` — PASS
- `node scripts/viona-ai-phase1-readiness-check.mjs` — PASS
- `node scripts/viona-route-capability-inventory.mjs` — PASS
- `npx tsc --noEmit` — PASS (after `npx prisma generate` in fresh worktree)
- `npm run smoke` — PASS
- Conflict marker grep — PASS

---

## 2. Completed milestones

1. **ReferenceLab navigator fix** — merged to master; `/travel`, `/home`, `/local`, `/ai` load without NativeStackNavigator crash from invalid gate component.
2. **Visual Tile PR #54** — merged; premium tile micro-scene visuals isolated from Travel hero/card lanes.
3. **Travel Location Master V2 PR #55** — merged; four location master v2 heroes, distinct Quick Help card artwork, responsive crop polish, QA evidence on master.
4. **Local dormant salvage** — branch `origin/viona/local-flagship-scene-salvage` @ `f4980c8` pushed; **no PR**; reference-only modules not wired to live UI.

---

## 3. Parked branches

| Branch | Worktree | Status |
|--------|----------|--------|
| `viona/travel-multi-scene-restore` | `c:\KNG\ket-noi-eu-travel-multi-scene-restore` | **Parked** — PR #55 merged; branch history superseded by squash merge on master |
| `viona/visual-tile-wip-isolate` | `c:\KNG\ket-noi-eu` (main) | **Parked** — `6e49303` patch-equivalent to PR #54; **1,887 untracked files preserved** |
| `viona/local-flagship-scene-salvage` | remote + `ket-noi-eu-master-sync` | **Parked** — dormant Local flagship scene candidates; pushed backup only |

---

## 4. Branches / worktrees to avoid

- **Do not continue coding on** `viona/visual-tile-wip-isolate` — stale tip, missing ReferenceLab fix and Travel #55.
- **Do not rebase or merge** the parked Travel or Visual Tile WIP branches without an explicit pack.
- **Do not clean** the 1,887 untracked files on main WIP without a dedicated cleanup/archive pack.
- **Do not delete** stashes or backup files (`TravelScreen.tsx.*-backup`, evidence bulk) without operator approval.

---

## 5. Safe next-start rule

1. **Branch from** `origin/master` @ `0becdfa` **or newer** (`git fetch origin` first).
2. **Prefer worktree:** `c:\KNG\ket-noi-eu-master-sync` or create a fresh worktree from `origin/master`.
3. **Do not** start feature work from parked WIP branch tips.
4. Run standard gates before any PR (forbidden claims, AI readiness, route inventory, `tsc`, smoke, `git diff --check`).

---

## 6. Product rules (unchanged)

Per Operating Protocol — **no fake production boundary:**

- No fake payment, booking confirmed, refund guaranteed, or payout/cash-out claims
- No fake SOS dispatch, rescue, or authorities-contacted claims
- No autonomous AI booking/payment/phone action without approved gates
- Preserve **Home** as UI standard reference
- Preserve **Premium App Tile** design doctrine (PR #54)
- Preserve **Travel #55** hero mappings and assets — do not regress Quick Help card distinct artwork
- Preserve **ReferenceLab** navigator fix — do not reintroduce `ReferenceLabStackScreensGate` as stack child

---

## 7. Travel final state (master @ #55)

### Code markers (`src/screens/b2c/TravelScreen.tsx`)

- `TRAVEL_HERO_LOCATION_MASTER_V2_IMAGES` — hero-only location masters
- `TRAVEL_HERO_LOCATION_MASTER_V2_BY_KEY` — default/journey → airport; interpreter/localGuide → Prague; rides → Paris; emergencyPolice → Berlin
- `TRAVEL_QUICK_HELP_CARD_IMAGES` — distinct `*_card-62y.png` per Quick Help card
- `TRAVEL_LOCATION_MASTER_V2_HERO_CROP` — responsive `objectPosition` per tier

### Assets (v2 masters)

- `assets/viona/dynamic-hero/travel/travel-airport-web-normal-master-v2.png`
- `assets/viona/dynamic-hero/travel/travel-prague-charles-bridge-castle-web-normal-master-v2.png`
- `assets/viona/dynamic-hero/travel/travel-paris-eiffel-web-normal-master-v2.png`
- `assets/viona/dynamic-hero/travel/travel-berlin-city-web-normal-master-v2.png`

### QA evidence

- `docs/design/evidence/travel-location-master-v2-clean-rebase-after-reflab-20260612-1741/` — post–ReferenceLab merge clean QA (`cardSrcDistinct: 4`, no navigator crash)

---

## 8. Local salvage state

| Item | Value |
|------|--------|
| Remote branch | `origin/viona/local-flagship-scene-salvage` |
| Commit | `f4980c8` — `chore(local): salvage dormant flagship scene candidates` |
| Files | `LocalFlagshipSceneAssetLayer.tsx`, `vionaLocalFlagshipSceneAssets.ts`, `LocalCommandCenterPanel.tsx` |
| Wired to live UI | **NO** — dormant/reference only; PNG requires commented |
| Evidence | `docs/design/evidence/local-flagship-scene-salvage-20260612-2138/SALVAGE_NOTE.md` (on salvage branch) |

Future Local visual pack: import PNGs under `assets/viona/reference/local/flagships/`, uncomment registry, wire via Reference Lab or feature flag first.

---

## 9. Next recommended packs

| Priority | Pack | Notes |
|----------|------|-------|
| 1 | **New feature from origin/master** | Any universe work branches from `0becdfa+` |
| 2 | **Local flagship PNG pack** (optional) | Cherry-pick/wire from `viona/local-flagship-scene-salvage` |
| 3 | **Untracked archive/cleanup pack** (optional) | Main WIP evidence/scripts bulk — inventory only until dedicated pack |
| 4 | **Runtime smoke pack** (optional) | Metro OOM observed on fresh worktree; use existing server or lighter ports if needed |
| 5 | **Push this handoff doc** (optional) | Small docs PR to master when operator approves |

---

## Quick reference — worktrees

| Path | Branch / HEAD | Use |
|------|---------------|-----|
| `c:\KNG\ket-noi-eu` | `viona/visual-tile-wip-isolate` | Parked WIP — read-only salvage source |
| `c:\KNG\ket-noi-eu-master-sync` | `origin/master` or docs branch | **Start here** |
| `c:\KNG\ket-noi-eu-travel-multi-scene-restore` | parked Travel branch | Archive only |
| `c:\KNG\ket-noi-eu-reference-lab-gate-fix` | local `master` @ `0becdfa` | Stale master checkout |
