# VIONA WAVE 3B — Local Stage First-View Lock + Home For You Scale

**Task:** `VIONA.WAVE_3B.LOCAL_STAGE_FIRST_VIEW_LOCK_AND_HOME_FOR_YOU_SCALE.1`

---

## Part A — Root cause (Local For You visible too early)

Local stacked **hero + kicker + cards + For You** in one continuous column with no viewport budget. Home uses a **fixed-height opening stage** (`fashionHomeWebOpeningStageShellStyle`) so hero + world cards fill the first screen; **VIONA dành cho bạn** sits below that block.

Even after label-aware hero tuning, Local at **1366×768** exceeded the fold:

| Block | Height |
|-------|--------|
| Command rail + pad | ~76px |
| Hero (max 504) | ~504px |
| Kicker corridor | ~22px |
| Cards | ~180px |
| For You bridge | 16px |
| **Total before For You panel** | **~798px** |

Viewport **768px** → For You title/panel appeared in first view. Increasing hero alone would worsen the overflow.

**Fix:** Stage-level first-view lock — viewport budget shrinks hero max and sets opening-stage `minHeight` so For You starts below the fold.

---

## Part A — Applied Local fix

### `LocalOpeningStageLayout.tsx`
- Split **opening stage** (hero + kicker + cards) from **For You**.
- `computeLocalOpeningStageFirstViewLock()`:
  - Desktop row (≥1024): `minHeight = viewport − chrome(76) − For You bridge(20) − buffer(8)`
  - Hero max from remaining budget (label band + 180px cards included)
  - Tablet (769–1023): hero budget only, no full stage lock
  - Mobile / compact landscape: no lock
- For You bridge: **20px** margin on desktop lock

### `LocalDynamicHero.tsx`
- Optional `openingStageHeroMaxPx` from stage budget (not blind hero increase)

---

## Part B — Home For You button scale

### `HomeScreen.tsx` (`quickActionPillDaylight*`)

| Token | Before | After | Delta |
|-------|--------|-------|-------|
| `minHeight` | 48 | **58** | +10px |
| `paddingVertical` | 6 | **8** | +2px |
| Icon capsule | 30×30 | **36×36** | +6px |
| Icon glyph | 19 | **21** | +2px |
| Label font | 15 / lh 19 | **16 / lh 21** | +1px |

Handlers, grid layout, hero hover unchanged.

---

## Evidence

- Local: `docs/design/evidence/wave-3b-local-final-hero-assets/`
- Home: `docs/design/evidence/wave-3b-home-for-you-scale/`

**Commit:** NOT COMMITTED
