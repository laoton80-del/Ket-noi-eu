# VIONA WAVE 3B — Local Home Size Parity (Section-Label-Aware Audit)

**Task:** `VIONA.WAVE_3B.LOCAL_HOME_SIZE_PARITY_WITH_SECTION_LABEL_AWARE_AUDIT.1`  
**Standard:** Home opening-stage rhythm; Local is **not** 1:1 because it includes **“Bắt đầu tại đây”** between hero and flagship cards.

---

## A. Home opening-stage audit

| Metric | Value | Source |
|--------|-------|--------|
| Dynamic hero height (desktop opening stage) | **430–494px** (viewport budget) | `FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN/MAX_PX` |
| Hero aspect (non-stage fallback) | `1280/540` | `FASHION_HOME_DESKTOP_HERO_ASPECT` |
| Hero → world cards gap | **6px** | `FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX` |
| Section label between hero & cards | **None** | — |
| World card cell min height | **180px** | `FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX` |
| World card grid gap | **12px** | `HomeScreen` `ftCardGrid.gap` |

### Home total opening stage (hero top → cards bottom) @ desktop

| Viewport | Hero | Gap | Cards | **Total** |
|----------|------|-----|-------|-----------|
| 1366×768 | ~494 | 6 | ~180 | **~680px** |
| 1024×768 | ~430–494 | 6 | ~180 | **~616–680px** |

---

## B. Local opening-stage audit (with label)

| Metric | Before label-aware pass | After tuning |
|--------|-------------------------|--------------|
| Dynamic hero (desktop web) | min **430**, max **494** | min **430**, max **504** (+10 label-aware bonus) |
| Hero → flagship row bridge | **6px** | **6px** (unchanged — hero to kicker top) |
| Kicker **“Bắt đầu tại đây”** | font **10**, implicit ~14px line | font **10**, **lineHeight 12** |
| Kicker → card grid gap | **8px** | **4px** |
| Flagship card cell (desktop row) | **180px** min | **180px** min |
| Card grid gap | **12px** | **12px** |

### Local label band math (desktop)

```
Hero bottom
  + 6px   heroCardsBridge (Home-parity hero→next-element)
  + 12px  kicker line (LOCAL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX)
  + 4px   kicker→grid (LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_PX)
  = 22px  hero-bottom → card-top corridor (vs Home 6px)
```

### Local total opening stage @ 1366×768 (estimated)

| Block | Before | After |
|-------|--------|-------|
| Hero | ~494 | **~504** |
| Label corridor | ~6+14+8 = **28px** | ~6+12+4 = **22px** |
| Cards | ~180 | ~180 |
| **Total** | ~702px | **~706px** |

Local stage is intentionally **~26px taller** than Home at the same viewport because of the orientation kicker — not a bug.

---

## C. Label-aware comparison

| Rhythm | Home | Local |
|--------|------|-------|
| Hero → first card | **6px** direct | **6px → label (12px) → 4px → card** |
| Hero depth | 430–494 | 430–504 (desktop) |
| Card height | 180px cell | 180px cell |
| Visual coupling | Hero sits on cards | Label bridges hero → cards |

### Root-cause diagnosis (pre-tuning)

1. **Dynamic hero too low?** — No at desktop (already at Home floor/cap).
2. **Label/gap consumes rhythm?** — **Yes.** Implicit ~14px line + 8px gap = **22px** label band on top of 6px bridge; cards felt visually detached.
3. **Cards shorter than Home?** — No after prior pass (180px cell).
4. **Total stage vs Home?** — Local was already taller; shallow *feel* came from **label corridor**, not missing pixels.

---

## D. Applied tuning (Local-only)

### `LocalDynamicHero.tsx`
- Desktop web max height: **494 → 504px** (`LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX = 10`) so hero mass stays premium after the kicker band.
- Min, aspect, mobile/tablet tiers unchanged.

### `LocalHeroCardsRow.tsx`
- Kicker `lineHeight`: **12px** (explicit, compact).
- Kicker → grid gap: **8 → 4px**.
- Label copy **unchanged** (`localHub.reframe.flagshipRowKicker`).

### Unchanged
- `LocalOpeningStageLayout` bridges (6px hero→row, 16px cards→For You).
- Handlers, routes, images, hover, For You grid.

---

## E. Image / readability

- No zoom transforms or asset swaps.
- +10px desktop max = minor even `cover` crop only.
- Kicker remains readable; tighter 4px gap keeps cards visually anchored to the guide line.

---

## F. Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/` — `EXPO_CAPTURE_PORT=8093 node scripts/capture-local-final-hero-assets.mjs`

---

## G. Manual QA

- [ ] `/home` vs `/local` @ **1366×768** — equally premium; Local not identical (has kicker).
- [ ] **“Bắt đầu tại đây”** visible, not awkward.
- [ ] **390×844**, **768×1024** — no overflow, no copy clip.

**Commit:** NOT COMMITTED.
