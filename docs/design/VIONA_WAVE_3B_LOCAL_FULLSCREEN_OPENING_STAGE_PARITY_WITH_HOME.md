# VIONA WAVE 3B — Local Fullscreen Opening Stage Parity with Home

**Task:** `VIONA.WAVE_3B.LOCAL_FULLSCREEN_OPENING_STAGE_PARITY_WITH_HOME.1`

---

## A. Home fullscreen rhythm (read-only)

| Behavior | Home |
|----------|------|
| Fullscreen flag | `isFullscreen` from `useFullscreenMode` |
| Stage layout | `computeFashionHomeWebOpeningStageLayout({ isFullscreen: true })` |
| Opening shell | Fixed `stageHeight` via `fashionHomeWebOpeningStageShellStyle` |
| Hero + cards | Fill first viewport below command bar |
| For You | Below stage; prompt **hidden** in fullscreen; dock reserve **124px** in budget |
| Bottom fit | Dock panel estimate **104px** + gap **6px** + viewport air **6px** |

Home fullscreen first screen = **header + hero + 4 world cards**; For You does not dominate.

---

## B. Local fullscreen rhythm (before fix)

| Issue | Detail |
|-------|--------|
| Fullscreen not wired | `isFullscreen` existed in `LocalScreen` but **not passed** to opening stage |
| Same budget as normal | No fullscreen chrome/bottom reserve adjustments |
| Local For You panel | Taller than Home dock (title + 2 pill rows) — peeked early in fullscreen |

Non-fullscreen lock (prior pass) worked at 1366×768; fullscreen needed separate budget.

---

## C. Root cause

Local For You appeared early in fullscreen because:

1. **`openingStageFullscreen` was never passed** — stage math ignored browser fullscreen.
2. **No bottom reserve** for Local cho bạn panel height (Home reserves dock in fullscreen budget).
3. **Chrome estimate too high** in fullscreen (browser UI hidden; rail-only ~58px).

---

## D. Applied fix

### `LocalScreen.tsx`
- `openingStageFullscreen={desktopWeb && isFullscreen}` → `LocalOpeningStageLayout`

### `LocalOpeningStageLayout.tsx`
- `computeLocalOpeningStageFirstViewLock(width, height, isFullscreen)`:
  - **Fullscreen chrome:** 58px (rail only)
  - **For You bridge:** 24px
  - **Below-fold buffer:** 16px
  - **Panel reserve:** 132px + Home dock gap/air (matches Home bottom-fit grammar)
  - **Stage lock:** enabled when `width ≥ 1024` **or** `openingStageFullscreen`
- Hero max from remaining budget (not blind hero increase)
- `forYouBridgeFullscreenLock` margin style

### Unchanged
- Label, cards, hero image, hover, handlers, For You grid logic

---

## E. Budget @ 1366×768 fullscreen

```
contentBudget = 768 − 58 − 24 − 16 − 144 ≈ 526px
heroMax ≈ 382px (budget-driven)
stageMinHeight ≈ 526px
For You starts ≈ 608px from top → below 768px viewport
```

---

## F. Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/`  
Manual QA: compare `/home` vs `/local` fullscreen @ 1366×768.

**Commit:** NOT COMMITTED
