# VIONA Wave 3B — Local Manual Screenshot QA

**Pack:** `VIONA.WAVE_3B.LOCAL_MANUAL_SCREENSHOT_QA.1`  
**Status:** **COMPLETE (PARTIAL)** — pixel screenshots captured @ `96a6b99`; Local hub verified on web after intent-modal dismiss + **Místní** tab navigation  
**Date (UTC):** 2026-05-24  
**Classification:** Visual QA evidence — **not** production launch, **not** commercial/Global Active, **not** native PASS

---

## 1. Baseline

| Item | Value |
|------|--------|
| **master / origin at QA** | `96a6b99` — `feat(local): balance Wave 3B semantic tile colors` |
| **Local visual wow layout fix** | **COMPLETE** (`0c503aa`) |
| **Local semantic color balance** | **COMPLETE** (`96a6b99`) |
| **Semantic color governance** | **COMPLETE** (`f1015a5`) |
| **VIONA state** | Pre-commercial / staging-pilot |
| **Global Active / full commercial** | **Not yet** |
| **Wave 2 native** | **NOT COMPLETED** |
| **Capture method** | `expo start --web --port 8088` + ephemeral Playwright (not in repo); dismiss Home intent modal → tab **Místní** → `local-tile-my-requests` visible |
| **Locale in capture** | **cs** (Czech UI strings); visual layout/colors independent of locale |

---

## 2. Screenshot matrix

| Viewport | Artifact | Status | Visual notes | Severity | Fix required |
|----------|----------|--------|--------------|----------|--------------|
| **390×844** | `docs/design/evidence/wave-3b-local/local-390x844.png` | **PARTIAL** | Local hub loads; compact hero + emerald safety chips; clarity block tile grid (emerald browse + cyan assist); request-status guide starts below fold; miniapp dock + bottom tabs visible | **LOW** — vertical scroll required for full service grid / connected universes | No |
| **768×1024** | `docs/design/evidence/wave-3b-local/local-768x1024.png` | **PARTIAL** | Same structure; wider tiles; multi-color status guide tiles (cyan/emerald/magenta) visible when scrolled | **LOW** | No |
| **1024×768** | `docs/design/evidence/wave-3b-local/local-1024x768.png` | **PARTIAL** | 3–4 col clarity grids; service grid denser; command rail present | **MEDIUM** — clarity + hero still occupy large above-fold stack | No |
| **1366×768** | `docs/design/evidence/wave-3b-local/local-1366x768.png` | **PARTIAL** | 4-col status guide + mode chip row (cyan/emerald/violet/gold/magenta); service modules row begins; strongest north-star alignment | **LOW** | No |

**First capture attempt:** **NOT RUN** for Local hub — artifacts showed **Home** intent modal only (`nav: none`, `hasLocalTile: false`). **Retried** with modal dismiss + tab click → valid Local artifacts above.

---

## 3. Visual verdict

**Overall: PARTIAL**

Local is **meaningfully different** from the pre–Wave 3B dashboard-like screenshots user rejected:

- Compact **premium app tiles** with icon capsule + status chip + title/subtitle
- **Emerald-led** hub atmosphere (hero frame, safety pills, section chrome)
- **Connected universes** migrated to tile grid (verified in source; below fold in phone capture)
- **No long horizontal universe link rows** in committed layout

**Not yet full PASS** vs north-star:

- Above-fold stack (command rail + hero + full clarity block) still **tall** on tablet/desktop before service grid
- **Classifieds** remain legacy row cards (out of this pack scope)
- **Double bottom chrome** (floating miniapp dock + tab bar) consumes vertical space — padding mitigates overlap but feels busy
- Glow/material depth improved but still **short of reference luminosity** (projection + spot-check history)

---

## 4. User-facing design assessment

| Question | Assessment |
|----------|------------|
| Significantly different from rejected screenshots? | **Yes** — tile grammar, compact grids, semantic chips |
| Matches north-star direction? | **Partially** — structure and multi-color semantics align; wow density/depth not fully there |
| What still prevents “wow”? | Tall clarity stack; classifieds row pattern; home-level polish on command rail; no native pixel pass |

---

## 5. Semantic color assessment

| Item | Finding |
|------|---------|
| **Leading accent** | **Emerald** — hero border, safety pills, hub kicker, default `variant="local"` |
| **Feature accents observed** | **Cyan** (booking assist, transit, housing, request-sent legend); **Gold** (legal/wealth, classifieds, merchant module, coming-soon chip); **Violet** (events, AI receptionist, demo modes); **Magenta** (declined legend, gated chip — caution not dispatch) |
| **Controlled multi-color?** | **Yes** — purposeful, not rainbow; ~4–5 accents across grids |
| **Misuse** | **None observed** — gold on legal/classifieds does not read as “paid”; magenta only on decline/gated |

---

## 6. Safety assessment

**Visible in screenshots (cs/en keys equivalent):**

| Invariant | Visible |
|-----------|---------|
| Request-only · no charge | **Yes** — hero + clarity pills |
| No payment captured | **Yes** |
| Confirmed ≠ paid | **Yes** |
| My Requests entry | **Yes** — in service grid (`local-tile-my-requests`); bridge copy above grid |
| Lite / Request / Demo / Pilot chips | **Yes** — mode chip row + tile status labels |

**No payment/commercial overclaim** in visible copy. No production-ready / Global Active language in capture.

---

## 7. Responsive checks (screenshot + source)

| Check | 390 | 768 | 1024 | 1366 |
|-------|-----|-----|------|------|
| Expected grid cols (services) | 2 | 3 | 4 | 4 |
| Primary titles clipped | No | No | No | No |
| Subtitles truncated gracefully | Yes (`numberOfLines`) | Yes | Yes | Yes |
| Horizontal overflow | No | No | No | No |
| Bottom content vs nav | Scroll; `bottomPadClearance` +48px in source | Adequate | Adequate | Adequate |
| Touch targets ~44px+ | Tiles meet min height | Yes | Yes | Yes |

---

## 8. Issues register

| ID | Severity | Issue | Recommended pack |
|----|----------|-------|------------------|
| L-QA-01 | **MEDIUM** | Clarity block + hero still tall before service grid on wide viewports | Optional `LOCAL_CLARITY_COMPRESS.1` or accept for pilot |
| L-QA-02 | **LOW** | Classifieds section remains non–PremiumAppTile rows | `LOCAL_CLASSIFIEDS_TILE.1` (later) |
| L-QA-03 | **LOW** | Double bottom nav (miniapp dock + tabs) | Home/shell alignment pack G |
| L-QA-04 | **LOW** | Capture locale cs — EN/VI parity not pixel-verified | i18n spot-check optional |
| L-QA-05 | **INFO** | Playwright not in repo; QA used ephemeral tooling | `WAVE_3B.DEMO_SCREENSHOTS.1` pipeline optional |

**BLOCKER / HIGH:** none.

---

## 9. Runtime fixes

**None** — QA docs/evidence only.

---

## 10. Next recommendation

| Priority | Action |
|----------|--------|
| **1** | **Proceed** with Account/SOS screenshot QA + any refinements using semantic color governance (already on `PremiumAppTile`) |
| **2** | Optional **LOCAL_CLARITY_COMPRESS.1** if leadership wants PASS (not BLOCKER) |
| **3** | Manual EN/VI capture pass before external demo |
| **4** | Wave 2 native RUN.2 when adb stable |

---

## 11. Signoff

| Verdict | Meaning |
|---------|---------|
| **PARTIAL PASS** | Local hub suitable for staging pilot visual review; improved vs rejected baseline; not marketing-final north-star |

**Not claimed:** production readiness, commercial readiness, native PASS, pixel-perfect north-star match.
