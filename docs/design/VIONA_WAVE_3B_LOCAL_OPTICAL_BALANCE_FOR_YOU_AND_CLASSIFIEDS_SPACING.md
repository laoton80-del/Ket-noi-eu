# VIONA Wave 3B — Local optical balance: Local cho bạn pills + Rao vặt spacing

Task ID: `VIONA.WAVE_3B.LOCAL_OPTICAL_BALANCE_FOR_YOU_AND_CLASSIFIEDS_SPACING.1`

## Goal

Improve optical balance and premium breathing room in (1) the Local cho bạn quick-action pills
and (2) the Rao vặt featured-preview classifieds section — without changing IA, routes,
handlers, preview/cap logic, or images.

## Root cause of the left-heavy / cramped feel

- **Local cho bạn pills**: tight `paddingHorizontal: 13` and a small `gap: 8` between the icon
  capsule and label. With a 40px-mass icon capsule on the left and a short label, the cluster
  read as pushed left with weak right breathing room.
- **Rao vặt section**: small, uniform spacing tokens (`gap: 10`, header copy `gap: 3`, subtitle
  `marginTop: 2`, grid `gap: 10`) compressed the header → CTA → cards → safety stack and left
  little gutter between cards, so the whole block felt crowded. The in-card overlay is rendered
  by the **shared** `VionaFashionWorldCard` (also used by the 4 Local opening cards and Home), so
  in-card padding was intentionally left untouched to preserve Home card grammar and the opening
  cards — breathing room was added at the section-composition level instead.

## A. What changed in Local cho bạn pills

`src/components/viona/local/LocalQuickActionsRow.tsx` — Local-scoped `LocalQuickActionPill` only
(shared Home pill untouched):

- `paddingHorizontal`: 13 → **18** (more left/right breathing; cluster sits with even margins).
- `gap` (icon ↔ label): 8 → **11** (calmer separation between capsule and text).
- `justifyContent: 'center'` retained so the cluster is optically centered, not left-cramped.
- Height (`minHeight` 50/46, `paddingVertical` 8), 2-row layout, responsive columns
  (8/4/4/3/2), handlers, and semantic accents all unchanged.

## B. What changed in Rao vặt featured-preview cards

`src/components/viona/local/LocalClassifiedsFeaturedPreview.tsx` — section composition spacing
only (card internals = shared Home grammar, unchanged):

- `wrap` gap: 10 → **14** (more air between header / CTA / cards / safety bands).
- `header` gap: 10 → **12**; `headerCopy` gap: 3 → **5**.
- `subtitle`: `lineHeight` 17 → **18**, `marginTop` 2 → **4**.
- `ctaRow` gap: 8 → **10** (post-listing vs view-all buttons breathe).
- Card grid `gap`: 10 → **12**; carousel gap: 10 → **12** (more inter-card gutter).
- `cellDouble` 48.8% → **48.4%**, `cellTriple` 32% → **31.5%** (absorb the larger gap so the
  2-up / 3-up grids never wrap).
- `safetyCopy`: `lineHeight` 15 → **16**, `marginTop` 2 (separates the safety line).
- Preview cap (3 wide / 2 narrow / 1), VIP-vs-demo honesty, create-listing, and view-all
  behaviour are all unchanged.

## C. Kept unchanged

Routes, handlers, payment/wallet/VIO, AI/SOS/backend/auth, classifieds cap logic, Local hero +
4 opening cards, current images + semantic accents, B2C/B2B separation, and the shared
`VionaFashionWorldCard` in-card overlay (Home card grammar).

## Safety drift report

Pure presentational spacing/padding changes in two Local-only components. No shared/global,
payment, AI, SOS, backend, auth, navigation, or image files touched. No logic or IA changes.

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/*` re-captured at `EXPO_CAPTURE_PORT=8093`
across 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Commit status

NOT COMMITTED.
