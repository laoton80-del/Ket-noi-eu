# VIONA WAVE 3B — Local Final Card Row Compact + For You Hover Parity

**Task:** `VIONA.WAVE_3B.LOCAL_FINAL_CARD_ROW_COMPACT_AND_FOR_YOU_HOVER_PARITY.1`

## Part A — Card row compact

**Root cause:** At 1366×768 fullscreen, the opening stack ended so close to the viewport bottom that the **“Local cho bạn”** panel title sat on the fold line — half on-screen, half below — while both pill rows were intended to fit.

**Fix (fullscreen desktop only):**

| Constant | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Flagship card min height | 168px | **160px** | −8px |
| Cards → Local cho bạn bridge | 8px | **6px** | −2px |
| Stage root bottom margin | 4px | **0px** | −4px |

**Total vertical savings:** ~**14px** — moves Local cho bạn up without touching dynamic hero.

## Part B — Local For You hover parity

Added Home-inspired **light utility** hover to `LocalQuickActionPill`:

- Semantic rim brightens via layered `boxShadow` (web)
- Glass background lifts (`0.72 → 0.84` alpha)
- Icon capsule glow + micro scale on hover/focus
- Top sheen gradient on hover (web)
- Micro motion: `translateY -1.5px`, `scale 1.004` (lighter than Home `-2px / 1.006`)

Effect hierarchy preserved: hero > flagship cards > For You pills.

## Files changed

- `src/components/viona/local/LocalHeroCardsRow.tsx`
- `src/components/viona/local/LocalOpeningStageLayout.tsx`
- `src/components/viona/local/LocalQuickActionsRow.tsx`

## Evidence

`$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-local-final-hero-assets.mjs`
