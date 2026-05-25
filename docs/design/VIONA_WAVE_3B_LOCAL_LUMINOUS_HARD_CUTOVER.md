# VIONA Wave 3B — Local Luminous Hard Cutover

**Pack:** `VIONA.WAVE_3B.LOCAL_LUMINOUS_HARD_CUTOVER.1`  
**Status:** **COMPLETE (PARTIAL)** — Local visual reference hard cutover; no HIGH/BLOCKER on 390  
**Date (UTC):** 2026-05-20  
**Baseline master:** `0eb62a3` — Local post-shell screenshot QA  
**Scope:** Visual-only — no routes, handlers, APIs, wallet, request logic, or no-charge invariants

---

## 1. Baseline

| Item | Value |
|------|--------|
| **User feedback** | Previous luminous polish rejected — frames/text/scenes still too weak vs reference |
| **Target** | Luminous AI premium glass: bright frames, near-white type, vivid semantic glow, inner card art |
| **Previous polish** | Uncommitted work-in-progress absorbed into this cutover (not committed separately) |
| **Shell** | `PremiumAppShell` + `PremiumHubLayout` preserved |

---

## 2. Cutover summary

### Old visual patterns removed

- Light sand/gold intent modal (`gradients.sandCard`, white option cards)
- Classifieds `LocalConstellationFrame` row cards (legacy glass)
- Muddy `INK_MUTED` subtitles on hub sections, composer, command rail
- Weak tile borders / empty interior cards

### Luminous frame changes

- `premiumTileGlass`: stronger edge (2px), halo, frame glow (0.72), deeper semantic shadows
- Accent map: brighter strokes/glows (emerald/cyan/violet/gold/magenta)
- `PremiumAppTile`: outer halo, micro-scene wash, larger scene slot

### Typography changes

- `premiumLuminousInk`: near-white titles/subtitles/chip labels
- `PremiumSection`, tiles, status chips, icon capsules use luminous ink
- Local composer + command copy migrated off muted gray

### Micro-scenes

- Canvas enlarged (`112×76`), mesh field + stronger glow orb
- All Local hub tiles, clarity CTAs/legend/capabilities, classified listings use semantic scenes
- Scenes sit behind text with controlled opacity

### Modal cutover

- **`IntentEntryModal`**: dark premium glass shell; `PremiumAppTile` option grid; luminous title/subtitle; behavior unchanged

### Classifieds cutover

- Listing grid uses `PremiumAppTile` + `listing-tags` micro-scene (no legacy row cards)
- Composer modal: dark glass panel (no sand/light-gray card)

---

## 3. Screenshot matrix

**Evidence:** `docs/design/evidence/wave-3b-local-hard-cutover/`  
**Capture:** `npx expo start --web --port 8088 --clear` → `node scripts/capture-local-hard-cutover.mjs`

| Artifact | Result | Severity | Notes |
|----------|--------|----------|-------|
| `local-390x844.png` | **PARTIAL** | LOW | Luminous frames + micro-art visible; safety chips readable; scroll/dock clearance OK |
| `local-768x1024.png` | **PARTIAL** | LOW | Multicolor grids + legend scenes |
| `local-1024x768.png` | **PARTIAL** | LOW | Wide hub density OK |
| `local-1366x768.png` | **PARTIAL** | LOW | Full rail + tile halos |
| `local-modal-390x844.png` | **PARTIAL** | LOW | Dark glass modal; premium option tiles; no sand cards |
| `local-modal-768x1024.png` | **PARTIAL** | LOW | 2-col intent options on tablet width |

**No HIGH or BLOCKER** on 390 hub or modal captures.

---

## 4. Safety / no-charge confirmation

| Invariant | Status |
|-----------|--------|
| Request-only / no charge visible | **PASS** — status strip + chips unchanged |
| No payment captured | **PASS** — copy unchanged |
| Confirmed ≠ paid | **PASS** — legend tile + chips |
| No logic drift | **PASS** — handlers/routes/API untouched |
| Forbidden commercial wording grep | **PASS** — no new violations in changed files |

---

## 5. Remaining backlog (LOW/MEDIUM only)

| ID | Severity | Item |
|----|----------|------|
| L-HC-01 | LOW | Hero + status strip may duplicate safety chips |
| L-HC-02 | LOW | 390 miniapp dock still consumes fold (scroll mitigates) |
| L-HC-03 | MEDIUM | Classified listing tiles show title/meta only (description in data, not on tile face) — acceptable for compact tile grammar |

---

## 6. Acceptance gate

| Criterion | Met |
|-----------|-----|
| No mixed old/new UI on Local hub | **YES** |
| Intent modal luminous cutover | **YES** |
| Brighter frames + type + scenes | **YES** |
| No HIGH/BLOCKER @ 390 | **YES** |
| Logic/API/no-charge unchanged | **YES** |

**Verdict:** Local is **visual reference-ready** for Travel recompose sign-off.

---

## 7. Files touched (cutover)

- `src/design/premiumTileVisualTokens.ts`
- `src/design/premiumTileMicroScene.ts`
- `src/components/viona/PremiumAppTile.tsx`
- `src/components/viona/PremiumTileMicroScene.tsx`
- `src/components/viona/PremiumSection.tsx`
- `src/components/viona/PremiumStatusChip.tsx`
- `src/components/viona/PremiumIconCapsule.tsx`
- `src/components/viona/index.ts`
- `src/components/localCommerce/LocalCommerceClarityBlock.tsx`
- `src/screens/b2c/LocalScreen.tsx`
- `src/components/IntentEntryModal.tsx` (global modal shell — visual only)
- `scripts/capture-local-hard-cutover.mjs`

**Not committed:** prior `VIONA_WAVE_3B_LOCAL_LUMINOUS_VISUAL_POLISH` draft docs/evidence (superseded by this pack).
