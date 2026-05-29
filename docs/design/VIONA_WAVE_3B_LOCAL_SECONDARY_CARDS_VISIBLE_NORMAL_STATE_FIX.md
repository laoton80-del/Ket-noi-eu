# VIONA Wave 3B — Local secondary cards: visible normal state fix

Task ID: `VIONA.WAVE_3B.LOCAL_SECONDARY_CARDS_VISIBLE_NORMAL_STATE_FIX.1`

## 1. Root cause of why the previous fix was not visible

The prior pass correctly removed the whole-section `opacity` (the structural root cause), but the
replacement **normal-state tokens were too conservative** — border `rgba(166,182,204,0.30)` and
fill `rgba(10,16,28,0.42)`. At full section opacity a 0.30 hairline over a deep-navy canvas is
still barely perceptible, so the cards continued to read as faint/disabled in the resting state.
The fix had to be applied at the actual rendered token level: a clearly visible normal border and
a surface fill that separates from the page canvas.

## 2. Files changed

- `src/components/viona/local/LocalMerchantToolsSection.tsx` — stronger normal-state tokens.
- `src/components/viona/local/LocalConnectedUniverseLinks.tsx` — stronger normal-state tokens.
- `docs/design/VIONA_WAVE_3B_LOCAL_SECONDARY_CARDS_VISIBLE_NORMAL_STATE_FIX.md` — this doc.
- `docs/design/evidence/wave-3b-local-final-hero-assets/*` — re-captured.

(`LocalScreen.tsx` needed no further change — its section wrappers already carry **no** opacity
after the previous pack; re-audited below.)

## 3. Parent opacity / dimming audit result

- `LocalScreen` wrappers `secondaryHubSection`, `merchantToolsSection`, `connectedUniversesSection`
  (and the unused `capabilitiesSection`): **no `opacity`** — confirmed (removed in the prior pack).
- Both card components: grepped for `opacity` → only code comments remain, **no opacity style** on
  any card / subtree. No `0.62 / 0.72 / 0.82 / 0.85` dimming anywhere on these sections.

So nothing dims the subtree; visibility is now purely a function of the card tokens below.

## 4. Normal-state visibility fix summary

Both `LocalMerchantToolsSection` and `LocalConnectedUniverseLinks` (identical):

| Token | Before | Now |
| --- | --- | --- |
| Normal border | `rgba(166,182,204,0.30)` | `rgba(176,192,214,0.52)` |
| Normal surface fill | `rgba(10,16,28,0.42)` | `rgba(10,16,28,0.66)` |
| Title | `rgba(238,245,255,0.92)` | `rgba(247,251,255,0.98)` (near-full white) |
| Subtitle | `rgba(176,194,218,0.72)` | unchanged (muted) |
| Hover/focus/press border | `rgba(198,214,234,0.52)` | `rgba(206,222,242,0.74)` |
| Hover/focus/press fill | `rgba(14,22,36,0.56)` | `rgba(14,22,36,0.74)` |
| Hover glow | `shadowRadius 3` | unchanged (soft, non-neon) |

Icon size (15px) + accent colours kept (clearly visible). The card is now obviously clickable in
its resting state. Hierarchy is preserved: no photo, no edge-lit glass, small icon, single-line
copy, modest fill — clearly below the Local For You panel and the photo classifieds cards. No
section height change, no double border, no heavy neon.

## 5. Bottom-section screenshot QA

The RN-web app scrolls in a nested container, so the standard full-page capture only covers the
first viewport; the secondary sections were verified with a throwaway bottom-scroll capture
(since deleted):

- **Cho doanh nghiệp Việt** (Byznys hub / Odeslat pomoc s rezervací / AI Receptionist) — normal
  state shows crisp, clearly visible borders, near-white titles, muted subtitles, clear icons.
- **Vũ trụ liên kết** (Travel Lite / Byznys hub / Academy Lite) — same; clearly clickable at rest.
- Both still read as secondary (flat, no photo) vs the primary cards. Confirmed at 1366×768 and
  390×844; no horizontal overflow, no white gutters.

## 6. Handler preservation

All handlers/links untouched (styling only): Business hub (`onMerchantHub`), Send booking assist
(`onBookingAssist`), AI Receptionist (`onAiReceptionist`), Travel Lite (`onTravel`), Business hub
connected link (`onBusiness`), Academy Lite (`onAcademy`).

## 7. Safety drift report

Presentational only — border/fill/title-alpha tuning in two Local-only card components. No IA,
routes, handlers, payment/wallet/VIO, AI/SOS, backend/auth, classifieds, or merchant/B2B business
logic touched. No horizontal overflow.

## 8. Commit status

NOT COMMITTED.
