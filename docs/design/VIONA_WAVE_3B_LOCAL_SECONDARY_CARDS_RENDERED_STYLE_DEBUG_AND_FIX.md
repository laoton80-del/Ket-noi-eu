# VIONA.WAVE_3B.LOCAL_SECONDARY_CARDS_RENDERED_STYLE_DEBUG_AND_FIX.1

Debug + fix for the secondary cards in **Cho doanh nghiệp Việt** (`LocalMerchantToolsSection`) and
**Vũ trụ liên kết** (`LocalConnectedUniverseLinks`) that "still looked unchanged / faint" after
prior visibility passes.

## Rendered component path (confirmed)

`LocalScreen.tsx` renders the **new** components directly — no old/duplicate section:

- `local-merchant-tools-section` → `LocalMerchantToolsSection` (around `LocalScreen` line 911)
- `local-connected-universe-links` → `LocalConnectedUniverseLinks` (around line 919)

Both section testIDs resolve in the live DOM (`merchantSection: true`, `connectedSection: true`).

## Root cause (why the previous fix wasn't visible)

The earlier passes kept raising the **alpha** of a near-black fill (`rgba(10, 16, 28, …)`) that sits
on the near-black Local page canvas (`#050B14`). Making a dark fill *more opaque over a dark
background* changes almost nothing visually — the card body never separated from the canvas, so the
only differentiator was a thin 1px border and the cards still read as faint/disabled. **The missing
lever was fill _luminance_, not alpha.** (Parent opacity was already removed in a prior pass and was
not the remaining cause.)

## Parent opacity / dimming audit

- `secondaryHubSection`, `merchantToolsSection`, `connectedUniversesSection`: **no `opacity`**, no
  `pointerEvents`, no dim/disabled wrapper.
- The only `opacity` values in `LocalScreen` are unrelated pressed-states (`shellUtilBtnPressed`,
  `commandPillPressed`, `gridCardPressed` = 0.88/0.9) and the composer modal animation.
- No `0.62 / 0.82 / 0.83 / 0.85` subtree dimming remains on these sections.

## Final values (normal vs hover) — applied to both components

| Token | Before | After (normal) | After (hover/focus/press) |
| --- | --- | --- | --- |
| Card background | `rgba(10, 16, 28, 0.66)` (dark-on-dark) | **`rgba(30, 43, 64, 0.78)`** (lighter elevated slate) | `rgba(42, 58, 84, 0.86)` |
| Border | `rgba(176, 192, 214, 0.52)` | **`rgba(178, 196, 222, 0.6)`** | `rgba(212, 226, 246, 0.82)` |
| Normal depth shadow | none | `shadowColor rgba(0,0,0,0.45)`, offset `0,2`, radius `4`, elevation `1` | soft cool glow (radius 4, elevation 2) |
| Title | `rgba(247, 251, 255, 0.98)` | `rgba(247, 251, 255, 0.98)` (near-full white, kept) | — |
| Icon | accent `…,0.9` | accent `…,0.9` (kept) | — |
| Subtitle | `rgba(176, 194, 218, 0.72)` | **`rgba(196, 212, 232, 0.82)`** (muted but readable) | — |

No photo background, no edge-lit hero glass, no heavy neon — the cards stay clearly secondary
relative to the primary hero/flagship cards.

Live computed-style probe confirmed the rendered values:
`backgroundColor: rgba(30, 43, 64, 0.78)`, `borderColor: rgba(178, 196, 222, 0.6)`.

## Visual proof (before/after)

- **Before:** `…/wave-3b-local-final-hero-assets/local-lighting-bottom-1366x768.png` — secondary cards
  read as thin dark outlines, body indistinguishable from canvas.
- **After:** `…/wave-3b-local-final-hero-assets/local-secondary-cards-bottom-{1366x768,390x844}.png`
  — both rows now show a clearly filled, bordered, clickable panel that separates from the canvas
  while remaining secondary.

## Handlers preserved

Business hub (`openBusinessUniverse`), Send booking assist (`openLeonaPrefill`), AI Receptionist
(`AiReceptionistDemoSimulator`), Travel Lite (`openTravelUniverse`), Business connected link
(`openBusinessUniverse`), Academy Lite (`openAcademyUniverse`) — all unchanged. Only style tokens
were edited; no `onPress`/routing/IA changes.

## Safety

No IA, routes, handlers, images, or business logic touched. No payment/wallet/AI/SOS/backend/auth/
classifieds/merchant logic changes. Only visual style tokens in the two Local secondary-section
components.
