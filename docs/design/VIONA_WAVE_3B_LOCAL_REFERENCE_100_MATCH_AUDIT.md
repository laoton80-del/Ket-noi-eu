# VIONA Wave 3B — Local reference 100% match audit

**Pack:** `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_AUDIT.1`  
**Status:** Audit only — **no code changes**  
**Date:** 2026-05-20  
**Evidence reviewed:** `docs/design/evidence/wave-3b-local-reference-replica-panel/` (5 viewports)  
**North star:** Uploaded VIONA six-universe command-center image (design truth; not stored in repo)  
**Prior spec:** `VIONA_WAVE_3B_LOCAL_FULL_CARD_ARTWORK_SYSTEM.md` § Reference findings

---

## Executive summary

The Local top panel is **directionally correct** and reads as the same product family as the six-universe reference. It is **not** at reference-grade match yet.

**Composite visual match score: 74 / 100**

| Dimension | Score | One-line verdict |
|-----------|------:|------------------|
| Same product family | **82** | Contained universe panel + 4 semantic flagship tiles — yes; page chrome and copy stack differ |
| Premium / wow | **72** | Glow and borders improved; interior luminance still below reference |
| Card sharpness | **78** | Thin bright rims + CTA orbs land; card **proportion** is the miss |
| Micro-scene quality | **68** | Integrated vectors exist; too small, wireframe, not “hero bright” |
| Panel cohesion | **76** | Panel + tray + header bands feel modular but not as tight as reference block |

**Commit gate:** Do **not** commit until composite ≥ **92** and no P0 gaps below remain.

---

## Method

1. Manual review of replica captures at 390×844, 844×390, 768×1024, 1024×768, 1366×768.
2. Cross-check against documented reference findings (`LOCAL_FULL_CARD_ARTWORK_SYSTEM.md`).
3. Cross-check against implemented tokens (`LOCAL_COMMAND_CENTER_FLAGSHIP_MIN_HEIGHT` 110–118px, scene slot ~47–50% card height, nested `flagshipTray`).

The uploaded reference PNG is **not** in the repository; deltas use the user-provided reference image grammar plus the prior reference audit table.

---

## 1. Panel proportion

| Check | Reference expectation | Current (replica captures) | Gap |
|-------|---------------------|---------------------------|-----|
| Panel as one universe block | Single luminous module; cards sit on **panel floor** | Outer panel + **inner flagship tray** (second border/fill) | **Medium** — reads “box inside box” |
| Panel height vs viewport | ~35–45% of hub viewport on desktop; intentional, not stretched | ~45–55% on 1024×768/1366×768; header copy adds height | **Medium** — slightly tall |
| Header vs cards ratio | Header **compact** (~20–25% of panel interior) | Header ~**30–40%** (title row + meta + trust + 3 safety chips) | **High** — main proportion blocker |
| Card vertical position | Cards **close** under header / safety row | Visible gap between chips and grid; tray padding adds margin | **Medium** |
| Same contained block feel | One universe atmosphere | Yes at a glance; detail breaks on zoom | **Low–medium** |

**Verdict:** Panel containment is **close**; **header vertical budget** and **nested tray** prevent “same block” parity.

---

## 2. Header grammar

| Element | Reference | Current | Gap |
|---------|-----------|---------|-----|
| Universe icon | Small but **legible** universe glyph; often square well | 28×28 location pin well — OK size | **Low** |
| Title | Short **“LOCAL UNIVERSE”** weight; uppercase; strong | `localCommerce.title` renders long (e.g. UNIVERSE LOCAL — …); correct i18n, **long** | **Medium** (layout, not copy change) |
| Subtitle rhythm | 1–2 lines max under title | Title row + `metaLine` + `trustLine` = **3+ lines** before chips | **High** |
| Title weight | Bold, high contrast, tight tracking | 11px kicker + 10px tagline — slightly **small** vs reference title presence | **Medium** |
| Header → cards spacing | Tight handoff | Chips then tray gap — feels **stacked** | **Medium** |
| Safety chips | Present, readable, not dominant | Three emerald chips — **correct semantics**; consume vertical space | **Low** (keep copy; compress layout) |

**Verdict:** Grammar structure (icon + universe label + trust + chips) is **right**; **line count and font hierarchy** are not reference-tight.

---

## 3. Flagship card geometry

| Property | Reference (from prior reference audit) | Current code / captures | Gap |
|----------|----------------------------------------|-------------------------|-----|
| Aspect | Primary **4:5** portrait-leaning (~1:1.2–1:1.4) | ~**1.6:1 to 2:1** landscape at 4-col desktop | **High** |
| Min height | Primary **~140px** mobile; scene-first | **110–118px** flagship heights | **High** |
| Scene area | **55–65%** of card | ~**45–50%** lower band + text veil | **High** |
| Border | Bright, clean, thin | 1.6px + glow — **close** | **Low** |
| Corner radius | ~14–16 unified | 16 tile / 14 panel — **close** | **Low** |
| Inner padding | Balanced; text upper-left | 8px vertical; chip row consumes top | **Medium** |
| Card gap | Tight but even | 7–9px — **reasonable** | **Low** |
| 4-card rhythm | 4 across desktop; 2×2 mobile | Matches — **yes** | **None** |
| CTA circle | Lower-right arrow orb | Present — **yes** | **None** |

**Verdict:** **Geometry and scene footprint** are the largest structural miss vs reference, not border color.

---

## 4. Color and glow

| Check | Reference | Current | Gap |
|-------|-----------|---------|-----|
| Semantic vividness | Emerald / cyan / gold / violet **electric** | Colors read correctly per card | **Low** |
| Outer glow | Strong halo, controlled bloom | Halo present; sometimes **competes** with dark fill | **Medium** |
| Inner rim | Clear inner light edge | `innerRimOpacity` 0.92 on flagship — **good** | **Low** |
| Card fill | Dark glass but **interior bloom** behind scene | Very dark `rgba(2–3, 8–14)` — can feel **flat/muddy** | **Medium** |
| Premium vs muddy | Luminous modules | Border vivid; **center** still dull vs reference | **Medium** |

**Verdict:** **Accent colors** are on-brand; **interior luminance** (fill + scene bloom) lags reference.

---

## 5. Micro-scene quality

| Check | Reference | Current (replica) | Gap |
|-------|-----------|-------------------|-----|
| Integration | Scene feels **part of** card glass | Vector slot + wash — improved but separate layer feel | **Medium** |
| Size | Large, bright, thumbnail-readable | Small; dominates neither card nor border | **High** |
| Position | Lower half, **center-weighted** | Lower half, **right-biased** (`left 18%`, `right 28` for CTA) | **Medium** |
| SVG-like | Illustration / UI concept art | Thin neon lines — **wireframe** | **Medium** |
| Hero object | One clear subject | Per-card subjects exist (timeline, calendar, scales, community) | **Low** |
| Thumbnail readability | Instant at 4-col | Requires **reading** title; scene not enough alone | **High** |
| Fake UI | None | None — **good** | **None** |

**Per flagship scene (replica captures):**

| Card | Reference intent | Current read | Gap |
|------|------------------|--------------|-----|
| My requests | Timeline + check node | Horizontal path + nodes — OK concept, **small** | Size / brightness |
| Booking assist | Calendar + appointment beam | Calendar grid + beam — OK, **low contrast** | Luminance |
| Legal & wealth | Scales + doc/shield | Scales + doc — OK, not hero-sized | Scale |
| Discover / community | Service network / hub | Community diamond + nodes on discover tile — OK mapping | Size; scene key swap acceptable |

**Verdict:** Scenes are **correct semantically** but fail reference **scale and luminance** tests.

---

## 6. Background richness

| Check | Reference | Current | Gap |
|-------|-----------|---------|-----|
| Skyline / network | Visible depth behind cards; horizon glow | 12-node SVG + grid — **present** | **Low–medium** |
| Behind cards specifically | Glow pool under card row | Tray dark fill **masks** backdrop | **Medium** |
| Too empty | No | Improved vs early CC panel | — |
| Too noisy | No | Acceptable | — |
| Product family | Six-universe city-network language | Matches Local emerald/cyan | **Low** |

**Verdict:** Panel backdrop is **adequate**; **inner tray opacity** reduces perceived depth vs reference.

---

## 7. Overall product feel (0–100)

See executive table. Blocking themes:

1. **Cards too flat** (width >> height at desktop).  
2. **Scenes too small / dim** (not 55–65% hero band).  
3. **Header too tall** (multi-line stack + chips before grid).  
4. **Nested tray** breaks single-floor reference composition.  
5. **Page-level shell** (hub title bar, large logo, floating dock) is outside six-universe reference frame — acceptable for app, but lowers “same screen” match score.

---

## Exact gaps blocking 100%

### P0 — must fix for commit gate

1. **Flagship card aspect ratio** — increase height or reduce effective width so modules approach **4:5**, not wide dashboard chips.  
2. **Scene footprint** — raise scene slot to **≥55%** of card interior; increase vector scale and interior bloom.  
3. **Header vertical compression** — same i18n strings, fewer visible lines (collapse meta/trust, tighter chip row, reduce padding).  
4. **Remove or flatten inner flagship tray** — cards should sit on **panel floor**, one border system.

### P1 — strong reference lift

5. **Interior card luminance** — brighter semantic wash under scene; less muddy center fill.  
6. **Scene centering** — reduce right bias; reserve CTA orb without shrinking scene.  
7. **Title presence in card** — slightly larger flagship title; status chip smaller/lighter.  
8. **Panel backdrop visibility** — let skyline show through card area (lower tray opacity).

### P2 — polish

9. **Universe title visual weight** — slightly larger panel title without new strings.  
10. **Desktop 4-col max-width per card** — cap cell width so cards don’t stretch horizontally.  
11. **Replica scene pass** — thicker core strokes + fill glow on hero objects only.  
12. **Landscape phone (844×390)** — verify 2×2 still portrait-leaning, not squat strips.

---

## Priority order of fixes

| Order | Pack theme | Expected lift |
|------:|------------|---------------|
| 1 | **Geometry + scene footprint** (height, aspect, slot %) | +10–12 pts |
| 2 | **Panel shell cohesion** (header compress, tray removal) | +6–8 pts |
| 3 | **Scene luminance + integration** (bloom, scale, centering) | +6–8 pts |
| 4 | **Desktop cell width cap** | +3–4 pts |
| 5 | **Micro-scene hero stroke pass** | +2–4 pts |

---

## What should NOT be touched anymore

| Area | Reason |
|------|--------|
| Routes, navigation, handlers | Product lock |
| Safety copy **meaning** (REQUEST-ONLY, NO CHARGE, CONFIRMED ≠ PAID) | Compliance |
| Wallet / payment / VIO / API / auth / AI / SOS logic | Out of scope |
| Travel / Academy / Business / Account / SOS UI | Out of scope |
| i18n key strings (unless product approves copy shorten) | User rule — compress via layout only |
| PNG / generated card artwork folders | Explicit ban |
| Below-panel Local modules (restaurant, transit, capabilities, feed, etc.) | Preserve; already present |
| Flagship **order** and **semantic accents** (emerald / cyan / gold / violet) | Correct |
| `commandCenterFlagship` + CTA orb pattern | Correct direction; tune size only |
| Vector-only scene strategy | Correct; improve execution |

---

## Recommended next implementation pack

### `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_GEOMETRY.1` (do first)

**Goal:** Close P0 #1–#4 without touching handlers or i18n text.

**Allowed:** `LocalCommandCenterPanel.tsx`, `PremiumAppTile.tsx` (flagship heights, tray removal, header layout), `LocalScreen.tsx` (grid gap / columns only).

**Targets:**

- Flagship min-height **~132–148px** mobile, **~128–140px** desktop 4-col (tune per viewport).  
- Scene slot **55–62%** card height; CTA orb overlay unchanged.  
- Panel header **≤25%** of panel interior on 1024×768 capture.  
- Single-floor panel (no inner tray border).

**QA:** Re-capture `wave-3b-local-reference-replica-panel/` or new `…-geometry/` folder; compare again.

### `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_SCENE_LUMINANCE.1` (second)

**Goal:** P0 scene brightness + P1 integration.

**Allowed:** `LocalVectorMicroScene.tsx` (flagship keys only), `PremiumAppTile.tsx` (wash/veil opacities for `commandCenterFlagship`).

**Targets:** Hero object + platform glow; +15–20% scene scale in flagship mode; center-weighted slot.

### `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_DESKTOP_CELL_CAP.1` (third, small)

**Goal:** Prevent ultra-wide squat cards at 1366×768.

**Allowed:** `PremiumTileGrid` / `LocalScreen` column basis or max-width on flagship cells only.

---

## Screenshot evidence notes (replica set)

| Viewport | Panel | Cards | Main issue |
|----------|-------|-------|------------|
| 390×844 | 2×2 grid; panel ~half screen | Compact but **short** | Header + chips tall; scenes small |
| 844×390 | Panel ~70% height; header ~⅓ panel | **Landscape-leaning** 2×2 | Card aspect wrong for reference |
| 768×1024 | Similar to phone | 2×2 | Same geometry issue |
| 1024×768 | 4-across; strong colors | **Wide flat** tiles | Desktop aspect + header stack |
| 1366×768 | Same as 1024 | Cards **wider**, scenes smaller relative | Cell width + scene % |

---

## Safety drift report

**No safety drift observed** in replica captures:

- REQUEST-ONLY, NO CHARGE, NO PAYMENT CAPTURED, CONFIRMED ≠ PAID chips visible.  
- Status chips use request/demo/lite — no paid/settled/payout/escrow language.  
- CTA orbs are decorative; no fake payment success UI.

Audit did **not** change product logic.

---

## QA commands (audit run)

| Command | Result |
|---------|--------|
| `git status -sb` | `master` ahead 2; Local Wave 3B files untracked/modified (not committed) |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass (0 errors, pre-existing warnings) |
| `npm run smoke` | Pass |

---

## Geometry pack result (`LOCAL_REFERENCE_100_MATCH_GEOMETRY.1`)

**Implemented (not committed):** flagship heights 136–144px; scene slot 58%; header compressed (combined meta line); `flagshipFloor` replaces bordered tray; desktop `maxWidth` 176px on flagship tiles.

**Estimated score after geometry:** **~86–89 / 100** (up from 74; luminance/integration pack likely still needed for ≥ 92).

**Evidence:** `docs/design/evidence/wave-3b-local-reference-100-match-geometry/`

---

## Commit status

**NOT COMMITTED** — audit-only pack; geometry pack also not committed.

---

## Sign-off checklist (for future 100% claim)

- [ ] Panel header ≤25% interior height @ 1024×768  
- [ ] Flagship cards portrait-leaning (visual 4:5 ±10%) @ 4-col desktop  
- [ ] Scene band ≥55% card height, bright enough to read without title  
- [ ] Single panel floor (no inner tray box)  
- [ ] Semantic colors vivid, not muddy center  
- [ ] All below-panel Local functions still present  
- [ ] Safety copy unchanged  
- [ ] Side-by-side with uploaded reference approved by product owner
