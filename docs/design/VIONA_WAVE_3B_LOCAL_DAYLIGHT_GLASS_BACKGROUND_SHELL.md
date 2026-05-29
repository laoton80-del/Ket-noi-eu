# VIONA Wave 3B — Local Daylight Premium Glass Background Shell

**Pack:** `VIONA.WAVE_3B.LOCAL_DAYLIGHT_GLASS_BACKGROUND_SHELL.1`
**Goal:** Make the Local page background brighter and more daylight-premium — daily-life,
friendly, bright — without flattening it into a white page, a full-page photo, or a noisy
cyber-dark scene. Keep dark-glass hero/cards crisp, readable, and theme-stable.

## Root cause — why Local read as a night page

The Local screen renders inside the shared `PremiumAppShell`, which paints an **opaque**
near-black canvas (`premiumTileCanvas.base = #050B14`) plus two dark veils
(`readabilityVeil`, `contentFieldVeil`). The `LocalScreen` background layers
(`canvasBackdropVeil`, `canvasGlow`, `contentFieldVeil`) live *behind* that opaque canvas, so
they were effectively invisible. Net effect: the page always read as night/cyber-dark.

`PremiumAppShell` is shared (Home and other universes use it) and is **not** in the allowed
file list, so the brightness had to come from a Local-only layer that sits **above** the
shell's dark canvas/veils but **below** the Local content.

## What changed

`src/screens/b2c/LocalScreen.tsx` only:

1. **Local-only Daylight palette constants** — deep daylight teal/blue-green base
   (`#0C2730`), brighter sky-teal top (`#1A434C`), deep bottom (`#0A2128`), warm golden-hour
   glow, and low-opacity emerald/cyan aurora.
2. **`LocalDaylightShellBackdrop`** — a `pointerEvents="none"` layered backdrop:
   - vertical daylight-teal base gradient (opaque — overrides the shell's night canvas),
   - warm golden-hour glow near the top/hero (web: a soft `radial-gradient`; native: a top
     warm→transparent `LinearGradient`),
   - a very subtle diagonal emerald→cyan aurora at low opacity.
   On **web** it uses `position: fixed` so the wash stays put while scrolling and also covers
   any edge gutters; on native it falls back to an absolute fill.
3. **Stacking** — the backdrop is injected as the first child of `PremiumAppShell` at
   `zIndex: 0`; all existing Local content (command rail + `PremiumHubLayout`) is wrapped in a
   `daylightContentLift` view at `zIndex: 1`, so content (and its glass depth) always paints
   above the wash. The floating dock and modal are outside the shell and unaffected.
4. **Web page canvas** — the existing Local web compensation (html/body paint + legacy-hide
   `<style>`) now paints the brighter `LOCAL_DAYLIGHT_CANVAS` instead of the old night canvas,
   so any sliver/gutter matches the daylight shell (768×1024 stays gutter-free).
5. `SafeAreaView` container background moved to the daylight base for safe-area edges.

No full-page photo is used; the daylight mood is pure gradient/glass.

## Contrast / readability

- Hero and the four flagship cards are dark glass; on the brighter teal base they gain
  contrast (darker cards on a lighter field) while keeping crisp frames, semantic rims, and
  hover glow.
- All page text sits on glass surfaces (hero scrim, panels, pills, status strip), so the
  brighter base does not reduce text contrast. Kickers, headlines, and subtitles remain
  legible across viewports.

## Theme / hover

- The daylight backdrop is **unconditional** (not tied to the Day/Night `daylightBoost`
  toggle), so toggling Bật đèn / Tắt đèn does not remove or weaken the background, frame, or
  glow. Local stays visually stable — theme-invariant.
- Card hover still sharpens rim/glow normally (content layer is untouched).

## Screenshot QA by viewport

See `docs/design/evidence/wave-3b-local-final-hero-assets/`.

- 390×844 — daylight teal shell; hero/cards readable; pills/dock readable; no overflow.
- 768×1024 — no white gutters; daylight teal; even borders.
- 844×390 — compact hero crisp on daylight base; dock readable.
- 1024×768 — uniform card rims; Local For You readable; daylight base.
- 1366×768 — daylight teal, premium glass depth retained; hover sharpens cleanly.

## Safety drift report

- No IA, route, handler, or business-logic changes.
- No payment/wallet/VIO, AI, SOS, backend/auth, classifieds feed/composer, or merchant/B2B
  logic touched.
- HomeScreen, App.tsx, global.css, navigation/routes, `src/design/index.ts`, and shared
  shell tokens untouched. No image assets added or replaced.

## Commit status

NOT COMMITTED.
