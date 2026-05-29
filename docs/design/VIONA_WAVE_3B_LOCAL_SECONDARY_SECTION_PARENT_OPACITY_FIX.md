# VIONA Wave 3B — Local secondary section parent-opacity fix

Task ID: `VIONA.WAVE_3B.LOCAL_SECONDARY_SECTION_PARENT_OPACITY_FIX.1`

## 1. Root cause confirmation

The previous component-level fix could not win because `LocalScreen` dimmed the **entire
section subtree** with `opacity` on the wrapper `View`s:

- `secondaryHubSection` → `opacity: 0.88` (applied to both sections)
- `merchantToolsSection` → `opacity: 0.82` (Cho doanh nghiệp Việt)
- `connectedUniversesSection` → `opacity: 0.62` (Vũ trụ liên kết)

A parent `opacity` < 1 collapses the whole subtree to a single transparency group, so borders,
icons, titles, subtitles **and** hover/glow were all dimmed together — the cards read as
disabled, and no amount of per-card tuning could fully recover them (especially the 0.62 group).

## 2. Files changed

- `src/screens/b2c/LocalScreen.tsx` — removed whole-section `opacity` from the wrappers.
- `src/components/viona/local/LocalMerchantToolsSection.tsx` — re-tuned card tokens.
- `src/components/viona/local/LocalConnectedUniverseLinks.tsx` — re-tuned card tokens.
- `docs/design/VIONA_WAVE_3B_LOCAL_SECONDARY_SECTION_PARENT_OPACITY_FIX.md` — this doc.
- `docs/design/evidence/wave-3b-local-final-hero-assets/*` — re-captured.

## 3. Parent opacity fix summary

Removed `opacity` from `secondaryHubSection` (0.88), `merchantToolsSection` (0.82) and
`connectedUniversesSection` (0.62). The section wrappers now render at full opacity; hierarchy is
expressed by the cards' own tokens, not by dimming the subtree. (`capabilitiesSection`, an unused
style, also had its stray `opacity` removed for consistency.) Spacing, the connected-section
hairline top divider, and all layout are unchanged.

## 4. Component tuning summary

With the parent no longer dimming, the previous (stronger) card tokens were slightly softened so
the cards stay **secondary** at full opacity — visible and clickable, but below primary:

| Token | Before (parent-dimmed) | Now (full opacity) |
| --- | --- | --- |
| Border | `rgba(166,182,204,0.38)` | `rgba(166,182,204,0.30)` |
| Surface fill | `rgba(10,16,28,0.5)` | `rgba(10,16,28,0.42)` |
| Title | `rgba(244,249,255,0.98)` | `rgba(238,245,255,0.92)` |
| Subtitle | `rgba(176,194,218,0.78)` | `rgba(176,194,218,0.72)` (muted) |
| Hover/focus border | `rgba(198,214,234,0.58)` | `rgba(198,214,234,0.52)` |
| Hover/focus glow | `shadowRadius 4` | `shadowRadius 3` (soft, non-neon) |

Icon size (15px) and accent colours kept. Hover/focus/press still sharpens the border + adds a
soft single-border glow (no double border, no heavy neon), wired via `onHoverIn/Out` +
`onFocus/Blur` with a single `activeId` per section.

## 5. Screenshot QA by viewport

Standard captures re-run at `EXPO_CAPTURE_PORT=8093` (390×844, 844×390, 768×1024, 1024×768,
1366×768): top-of-page premium canvas, hero, cards, Local For You unchanged; no overflow, no
white gutters.

## 6. Bottom-section manual QA

Verified the below-the-fold sections (the RN-web app scrolls in a nested container, so the
standard full-page capture only covers the first viewport) via a throwaway bottom-scroll capture
(since deleted):

- **Cho doanh nghiệp Việt** (Byznys hub / Odeslat pomoc s rezervací / AI Receptionist) — borders
  clearly visible, titles readable, subtitles muted, icons clear; clearly clickable.
- **Vũ trụ liên kết** (Travel Lite / Byznys hub / Academy Lite) — same; the previously most-dimmed
  (0.62) section is now clean and readable.
- Both remain flatter/lighter than the photo classifieds cards above → still secondary, not
  primary. Confirmed at 1366×768 and 390×844; no horizontal overflow.

## 7. Safety drift report

Presentational only: removed wrapper `opacity` and tuned card colour/border/fill tokens + hover
state in three Local-only files. No IA, routes, handlers, payment/wallet/VIO, AI/SOS,
backend/auth, classifieds, or merchant/B2B business logic changed.

## 8. Commit status

NOT COMMITTED.
