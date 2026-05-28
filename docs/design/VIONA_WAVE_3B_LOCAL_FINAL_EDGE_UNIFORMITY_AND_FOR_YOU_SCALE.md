# VIONA.WAVE_3B.LOCAL_FINAL_EDGE_UNIFORMITY_AND_FOR_YOU_SCALE.1

Final finish pass for the Local universe before commit. Two visual targets:

1. Make hero/card border lines even, crisp, and visually consistent with Home.
2. Make "Local cho bạn / Local for you" icon + text scale better inside the taller pills.

No IA, route, handler, image, or business-logic changes. Home left untouched (read for reference only).

## 1. Root cause of uneven lines

### Hero frame
`LocalDynamicHero` painted a `topGlow` layer — a 2px, full-width horizontal line pinned to
`top: 0` of the rounded frame. Because the frame clips at `radius.xxl` (26px), the straight
top line's ends were cut by the corner curve, producing a top-only line that "broke" at the
rounded corners and competed with the single premium edge stroke. Home's hero has no such
top line; its frame reads as one clean border.

### Hero cards
`LocalHomeParityCard` hosted the premium glass at `radius.xl` (20px) — both the host clip
(`fashionHomeWorldCardGlassHostStyle`) and the glass-layer overlay — while the inner
`VionaFashionWorldCard` content rounds at `radius.lg` (16px). The 4px corner-radius mismatch
meant the host's 1px inner rim sat outside the card content's rounded edge, leaving a thin
uneven sliver at each corner. The rim therefore read as soft/inconsistent rather than as one
crisp 1px frame hugging the card.

## 2. Files changed

- `src/components/viona/local/LocalDynamicHero.tsx`
- `src/components/viona/local/LocalHomeParityCard.tsx`
- `src/components/viona/local/LocalQuickActionsRow.tsx`
- `docs/design/VIONA_WAVE_3B_LOCAL_FINAL_EDGE_UNIFORMITY_AND_FOR_YOU_SCALE.md` (this file)
- `docs/design/evidence/wave-3b-local-final-hero-assets/*` (capture output)

## 3. Border / frame uniformity fix

- **Hero:** Removed the `topGlow` line layer (JSX + style + unused
  `FASHION_HOME_HERO_TOP_GLOW` import). The hero now relies on a single primary 1px frame
  system: the rounded `frame` clip + the `premiumCrispEdgeStroke(FASHION_HOME_FRAME_BORDER)`
  edge overlay, both at `radius.xxl`. No competing top-only line, no broken corner.
- **Cards:** Aligned the glass host clip and rim to the inner world-card radius. The host now
  carries an explicit `borderRadius: vionaTokens.radius.lg` (overriding the shared
  `radius.xl`), and the glass-layer overlay (`glassStyles.layers`) was moved from `radius.xl`
  to `radius.lg`. Host clip, rim, glass layers, and card content are now concentric, so the
  per-accent 1px semantic rim sits exactly on the card edge — one crisp, even border across
  all four cards.
- Semantic accent rim retained; thickness (1px) and alpha (per-accent ~0.68, hover ~0.82) are
  shared across all four cards, so rim quality is uniform.

## 4. Local For You icon/text scale

In `LocalQuickActionsRow` (local-scoped `LocalQuickActionPill`, shared Home pill untouched):

- Icon capsule `iconWrap`: 24×24 → 29×29 (radius 12 → 15).
- Icon glyph: `size={16}` → `size={17}`.
- Label: `fontSize` 12 → 13, `lineHeight` 15 → 16 (weight unchanged, `FontFamily.semibold`).
- Pill height (`minHeight` 50 desktop / 46 elsewhere), compact grid, 2-line label clamp,
  vertical centering, horizontal spacing, and all handlers preserved.

## 5. Hover / theme result

- Hover still sharpens the card rim (`...INNER_RIM_HOVER`) and corner glint without adding
  stacked lines; the concentric radii keep the sharpened rim aligned with the card edge.
- Theme toggle (Bật đèn / Tắt đèn) does not weaken or remove the border/glow: Local visuals
  remain on the theme-invariant premium dark-glass branch.

## 6. Screenshot QA by viewport

See `docs/design/evidence/wave-3b-local-final-hero-assets/`.

- 390×844 — hero frame crisp; cards uniform rim; For You pills proportional; no overflow.
- 768×1024 — no white gutters; even borders.
- 844×390 — compact hero frame crisp; pills compact.
- 1024×768 — uniform card rim; hero one clean border.
- 1366×768 — full grid; hover sharpens cleanly; For You scale balanced.

## 7. Safety drift report

- No IA changes.
- No route/handler changes.
- No image asset replacement.
- No payment/wallet/VIO, AI service, SOS, backend/auth, classifieds feed/composer, or
  merchant/B2B logic touched.
- HomeScreen, App.tsx, global.css, navigation/routes untouched.

## 8. Typecheck / lint / smoke

- `npx tsc --noEmit`: pass.
- `npm run lint`: pass (pre-existing warnings only).
- `npm run smoke`: pass.

## 9. Commit status

NOT COMMITTED.
