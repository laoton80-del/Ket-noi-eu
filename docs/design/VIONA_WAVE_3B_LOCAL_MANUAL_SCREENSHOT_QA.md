# VIONA Wave 3B — Local Manual Screenshot QA

**Pack:** `VIONA.WAVE_3B.LOCAL_MOBILE_RESPONSIVE_FIX.1` (post-fix QA update)
**Status:** **COMPLETE (PARTIAL)** — mobile responsive fix landed; post-fix pixel pass @ pending commit
**Date (UTC):** 2026-05-24  
**Classification:** Visual QA evidence — **not** production launch, **not** commercial/Global Active, **not** native PASS

---

## 1. Baseline screenshot verdict (pre mobile fix @ `b9e396f` evidence)

| Viewport | Pre-fix verdict | Severity | Notes |
|----------|-----------------|----------|-------|
| **390×844** | **FAIL / HIGH** | **HIGH** | Left clipping/horizontal overflow; command rail too wide; hero + clarity too tall; status guide partially under miniapp dock + tab bar |
| **768×1024** | **PARTIAL / PASS** | LOW–MEDIUM | Structure readable; some above-fold density |
| **1024×768** | **PASS / PARTIAL** | LOW–MEDIUM | Wider grids OK; clarity stack still tall |
| **1366×768** | **PASS / PARTIAL** | LOW | Strongest layout; minor vertical density |

**Prior QA doc (`LOCAL_MANUAL_SCREENSHOT_QA.1`)** rated 390 as PARTIAL/LOW after first capture — **user real-device review** and re-read of `local-390x844.png` elevated **390 to FAIL/HIGH** (overflow + dock overlap), driving this pack.

| Item | Value |
|------|--------|
| **master before fix** | `b9e396f` — `docs(design): record Wave 3B Local screenshot QA` |
| **Local visual wow + semantic balance** | Complete (`0c503aa`, `96a6b99`) |
| **VIONA state** | Pre-commercial / staging-pilot; REQUEST_ONLY_NO_CHARGE |

---

## 2. Fix summary (`LOCAL_MOBILE_RESPONSIVE_FIX.1`)

| Area | Change |
|------|--------|
| **Overflow** | Content rail `width/maxWidth 100%`, web `overflowX: hidden`; grid cells `minWidth: 0`, `flexShrink: 1`; tighter 2-col basis when `gap ≤ 12` (`47.5%`) |
| **Command rail (mobile)** | `<480`: stacked rail, full-width utility track, hub caption hidden; `<400`: icon-only shell utilities (44px targets, a11y labels kept) |
| **Hero compact** | `<480`: reduced padding, smaller headline/subtitle, tighter safety chip row |
| **Clarity compact** | `<480`: reduced card padding; `<400`: 1-col CTA + status/capability grids; CTA 2-col only ≥400 |
| **Service grid** | `<400`: 1 column; preserves semantic per-tile accents |
| **Bottom clearance** | `bottomPadClearance` +48 baseline + **+80** when `<480` for miniapp dock + tab bar + safe area |
| **Semantic colors** | Unchanged — emerald-led + controlled cyan/gold/violet/magenta feature accents |
| **Logic / API** | **None** — layout-only |

---

## 3. Post-fix QA matrix

| Viewport | Status | Notes | Artifact |
|----------|--------|-------|----------|
| **390×844** | **PARTIAL** | Re-captured post-fix (`nav=tab`, `hasLocalTile=true`): no severe left clip; icon-only rail + 1-col grids require **dev bundle reload** on port 8088; minor CTA title ellipsis (cs copy); miniapp dock still consumes fold — scroll + `+144` bottom pad | `docs/design/evidence/wave-3b-local/local-390x844.png` |
| **768×1024** | **PARTIAL** | Stable; 2–3 col clarity; scroll for service grid | `local-768x1024.png` |
| **1024×768** | **PARTIAL** | 3–4 col clarity; command rail readable | `local-1024x768.png` |
| **1366×768** | **PARTIAL** | 4-col status guide + mode chips visible with scroll | `local-1366x768.png` |

**Capture method:** `expo start --web --port 8088` → dismiss Home intent modal → tab **Místní** → verify `local-tile-my-requests` (Playwright ephemeral, not in repo).

**Post-fix pixel verdict:** **PARTIAL** — **390 HIGH cleared** (no horizontal clip); remaining **LOW** density/truncation/dock chrome. **Proceed** Account/SOS screenshot QA per §5.

---

## 4. Remaining issues

| ID | Severity | Issue |
|----|----------|-------|
| L-MOB-01 | **LOW** | 390 CTA title ellipsis on long cs strings — optional compact i18n |
| L-QA-01 | **MEDIUM** | Clarity + hero still tall on tablet/desktop (out of mobile pack scope) |
| L-QA-02 | **LOW** | Classifieds remain legacy row cards |
| L-QA-03 | **LOW** | Double bottom chrome (miniapp dock + tabs) |
| L-QA-04 | **LOW** | Capture locale cs — EN/VI parity not pixel-verified |

**BLOCKER / HIGH (post-fix):** none in source review; **390 HIGH cleared pending screenshot**.

---

## 5. Next recommendation

| Condition | Action |
|-----------|--------|
| **390 re-capture PASS/PARTIAL, no HIGH** | Proceed Account/SOS visual wow screenshot QA |
| **390 still FAIL/HIGH** | Run `LOCAL_MOBILE_RESPONSIVE_FIX.2` before Account/SOS rollout |

---

## 6. Safety & invariants (unchanged)

| Invariant | Preserved |
|-----------|-----------|
| Request-only / no charge | Yes — hero + clarity chips |
| No payment captured | Yes |
| Confirmed ≠ paid | Yes |
| No route/API/wallet changes | Yes |

**Not claimed:** production readiness, commercial readiness, native PASS, north-star pixel-perfect match.
