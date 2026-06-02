# VIONA Wave 3B — Travel Dynamic Hero Title (Pack 2, from audit)

**Scope:** `src/screens/b2c/TravelScreen.tsx` — hero title wrapper, inset, scrim, typography tokens only.

## Changes

| Area | Before | After |
|------|--------|-------|
| Normal inset | 48px | **42px** |
| Fullscreen inset | 52px | **44px** |
| Normal title @ 1366 | 56px / max 720px wrapper | **57px** / **800px** zone (wrapper min 780) |
| Fullscreen title @ 1366 | 56px | **54–55px** (54 when hero max &lt; 480px) |
| Wrapper @ 1366 normal | `min(820, max(720, 46%vw))` → 720 | `min(820, max(780, 52%vw))` → **780–800** |
| Wrapper @ 1366 fs | `min(860, max(760, 50%vw))` | `min(840, max(800, 52%vw))` → **800–820** |
| Text scrim | `textStackWidthPx` only | **`max(zone, 56–58% viewport)`** |
| Text veil | 76–78% | **58–60%** (editorial, less column-boxed) |

Active Quick Help titles share `travelDynamicHeroMetrics` — no per-card title branch.
