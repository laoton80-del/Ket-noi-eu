# VIONA WAVE 3B — Local Home Size Parity Audit & Apply

**Task:** `VIONA.WAVE_3B.LOCAL_HOME_SIZE_PARITY_AUDIT_AND_APPLY.1`  
**Standard:** Home opening-stage rhythm is the visual reference. Local follows; no IA/route/handler/image changes.

---

## A. Home size audit (read-only)

| Dimension | Home value | Source |
|-----------|------------|--------|
| Dynamic hero aspect (fallback) | `1280/540` (~2.37) | `FASHION_HOME_DESKTOP_HERO_ASPECT` |
| Opening-stage hero floor / cap | **430px / 494px** | `FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN/MAX_PX` |
| Hero height at desktop | Viewport budget → clamped **430–494px** | `computeFashionHomeWebOpeningStageLayout` |
| Hero container | Full opening-stage rail; bleed via `fashionHomeWebOpeningStageDeepHeroBleedStyle` | `HomeScreen.tsx` |
| World card cell min height | **180px** | `FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX` |
| World card inner min (component) | 172px (`heroRow`) | `VionaFashionWorldCard` |
| World card grid gap | **12px** | `styles.ftCardGrid.gap` |
| Hero → world cards gap | **6px** | `FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX` |
| World cards → For You | For You lives **below** opening stage in scroll; `quickActionStripFashion` `marginTop: 0` | `HomeScreen.tsx` |

### Home rendered hero height (estimated content width ≈ viewport − 32–48px pad)

| Viewport | Est. content W | Hero (opening stage) | Notes |
|----------|----------------|------------------------|-------|
| 1366×768 | ~1320 | **430–494** | Budget floor/cap |
| 1024×768 | ~992 | **430–494** | Floor wins over aspect |
| 768×1024 | ~736 | aspect ~**308** | Below desktop min width (769); mobile hero grammar |
| 390×844 | ~358 | aspect ~**151** + mobile layout | Stack hero |
| 844×390 | ~812 | compact / landscape | Short viewport grammar |

---

## B. Local size audit (before apply)

| Dimension | Local (before) | vs Home |
|-----------|----------------|---------|
| Hero aspect | `1600/624` (~2.564) | Taller ratio; width-driven |
| Hero minHeight | 202 / 232 / **304** | Desktop **−126px** vs Home 430 |
| Hero maxHeight | 356 / **544** | Uncapped above Home 494 on wide |
| @ 1024 (~992w) | aspect → **~387px** | **−43px** vs Home floor |
| @ 1366 (~1320w) | aspect → **~515px** | Hero OK; stage felt shallow elsewhere |
| Stage section gap | **12px** uniform (hero/cards/For You) | Hero→cards **+6px** vs Home |
| Flagship card gap | **10px** | **−2px** vs Home grid |
| Card cell minHeight | none (inner 172 only) | **−8px** vs Home cell 180 |
| Cards → For You | 12px | Tighter than Home stage separation |

**Root cause:** Local shallow feel was primarily **hero floor on desktop/tablet widths**, **missing 180px card cell floor**, and **uniform 12px stage gaps** (hero→cards too loose, cards→For You too tight vs Home stage rhythm).

---

## C. Difference summary

| Issue | Home | Local (before) | Fix applied |
|-------|------|----------------|-------------|
| Desktop hero depth | 430–494px | ~387–515 (no floor) | Import Home min/max on web ≥769 |
| Tablet hero | aspect ~308 | min 304 | min **320**, max **432** |
| Mobile hero | minimal | min 232 | min **236** (+4) |
| Hero → 4 cards | 6px | 12px | **6px** bridge |
| 4 cards → For You | below stage | 12px | **16px** bridge |
| Card row height | 180px cell | ~172 inner only | **180px** cell on desktop row |
| Card gap | 12px | 10px | **12px** |

---

## D. Applied Home parity (Local-only)

### `LocalDynamicHero.tsx`
- Desktop web (`width ≥ 769`, non-compact): `minHeight` **430**, `maxHeight` **494** (Home opening-stage constants).
- Tablet: `minHeight` **320**, `maxHeight` **432**.
- Mobile narrow: `minHeight` **236**, `maxHeight` **368**.
- Compact landscape: unchanged **202 / 356**.
- Preserved: `1600/624` aspect, `cover`, `objectPosition`, lighting network, semantic rim.

### `LocalOpeningStageLayout.tsx`
- Replaced uniform `gap: 12` with explicit bridges:
  - Hero → cards: **6px** (`FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX`)
  - Cards → Local cho bạn: **16px**

### `LocalHeroCardsRow.tsx`
- Desktop row cells: `fashionHomeWebOpeningStageCardCellStyle()` → **180px** min height.
- Grid/carousel gap: **12px** (matches Home `ftCardGrid`).

---

## E. Image crop / readability

- No zoom transforms, negative insets, or asset swaps.
- Hero still `objectFit: cover` with per-key `objectPosition` from `vionaLocalHeroVisuals`.
- Desktop floor adds ~40px vertical frame at 1024 — small even crop only; copy column unchanged.
- Card photos unchanged; 180px cell adds vertical room without clipping titles.

---

## F. Safety / drift

- **Not touched:** routes, handlers, HomeScreen, classifieds, merchant, wallet, AI/SOS, assets, App.tsx, global.css.
- **Preserved:** daylight hero image, hover lighting, B2C/B2B split, For You grid, Back/Home nav dedup.

---

## G. Evidence

Captures: `docs/design/evidence/wave-3b-local-final-hero-assets/`  
Script: `EXPO_CAPTURE_PORT=8093 node scripts/capture-local-final-hero-assets.mjs`

---

## H. Manual QA checklist

- [ ] `/home` vs `/local` at **1366×768** — hero height aligned, cards same rhythm
- [ ] **390×844** — no overflow, copy readable, faces visible
- [ ] **768×1024** — moderate hero lift only
- [ ] Hover Local hero + 4 flagship cards — lighting intact
- [ ] Local For You grid unchanged

**Commit:** NOT COMMITTED (per task scope).
