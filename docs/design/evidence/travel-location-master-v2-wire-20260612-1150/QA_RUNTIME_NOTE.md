# Runtime QA note

**Port:** 8277 (`npx expo start --web --clear`)
**Capture:** `_capture-qa.mjs` — 7 screenshots, 4 viewports

## Web navigator prerequisite

`viona/travel-multi-scene-restore` @ `4964365` still renders `<ReferenceLabStackScreensGate />` as a direct stack child and **crashes web** (`NativeStackNavigator` child-type error). Runtime capture used a **temporary** `App.tsx` checkout from `viona/travel-active-layer-stacked-qa` @ `001318d` (QA only — **not** included in pack commit).

## Visual result — PASS (operator review)

| State | Viewport | Result | Hero scene |
|-------|----------|--------|------------|
| Default | 1366×768, 1024×768, 768×1024, 390×844 | PASS | Airport v2 (futuristic terminal) |
| Hover translation | 1366×768 | PASS | Prague Charles Bridge + castle |
| Hover taxi | 1366×768 | PASS | Paris Eiffel / Seine |
| Hover emergency | 1366×768 | PASS | Berlin TV tower skyline |

Quick Help card tiles, copy, and badges unchanged.

## Automated src probe

`qa-report.json` `pass: false` — RN Web `Image` nodes under `data-testid` do not expose `HTMLImageElement.currentSrc` to Playwright. Visual screenshots are the authoritative proof for this pack.
