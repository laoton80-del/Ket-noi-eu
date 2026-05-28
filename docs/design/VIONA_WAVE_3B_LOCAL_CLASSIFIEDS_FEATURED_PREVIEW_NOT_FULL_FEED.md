# VIONA Wave 3B — Local classifieds featured preview (not full feed)

**Pack:** `VIONA.WAVE_3B.LOCAL_CLASSIFIEDS_FEATURED_PREVIEW_NOT_FULL_FEED.1`

## Product

Local main page shows a **compact featured preview** of classifieds, not an unbounded feed. Full search/filter/pagination belongs in a future dedicated classifieds hub.

## Behavior

| Viewport | Visible cards | Layout |
|----------|---------------|--------|
| ≥620px (tablet/desktop) | Max **3** latest/featured | Responsive grid |
| &lt;520px (narrow mobile) | Max **2** | Horizontal carousel |
| 520–619px | Max **2** | Two-column grid |

Posts are sorted VIP-first, then by date (`sortedPosts` in `LocalScreen`). Composer and full post state remain in `LocalScreen`; only rendering is capped.

## CTAs

- **Đăng tin mới / New listing** → opens existing composer modal (`setComposerVisible(true)`).
- **Xem tất cả / View all** → `scrollToClassifieds` (Lite/Pilot — no separate classifieds route yet).
- Card tap → same `onViewAll` handoff.

## Safety copy

Footer states: preview-only, demo on device, no payment captured, no sale/hire/lease guarantee, VIP highlight pilot-only.

## Files

- `src/components/viona/local/LocalClassifiedsFeaturedPreview.tsx` (new)
- `src/screens/b2c/LocalScreen.tsx`
- `src/i18n/locales/en.json`, `vi.json`
- `src/components/viona/local/LocalClassifiedsHeroSection.tsx` (superseded; kept for reference)

## Capture

```powershell
$env:EXPO_CAPTURE_PORT='8093'; node scripts/capture-local-final-hero-assets.mjs
```
