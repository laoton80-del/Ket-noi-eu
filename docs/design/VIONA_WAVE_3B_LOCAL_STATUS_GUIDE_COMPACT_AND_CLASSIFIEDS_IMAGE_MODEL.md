# VIONA Wave 3B — Local status guide compacting + classifieds image model

**Pack:** `VIONA.WAVE_3B.LOCAL_STATUS_GUIDE_COMPACT_AND_CLASSIFIEDS_IMAGE_MODEL.1`
**Goal:** (A) Compact the request status guide so it no longer dominates the Local main page,
and (B) make the classifieds featured preview ready to show user-uploaded listing photos with
safe category fallbacks — without implementing any upload/storage/backend.

## A. Request status guide compacting

The previous `LocalHubCompactStatusGuide` was a bordered block with a kicker, a 2-line note,
and a 2×2 legend of four status items (icon + 2-line text each) — visually heavy and
competing with the hero/cards/classifieds.

It is now a **single light pill strip** (`local-compact-status-guide`):

- One flow line: **Request sent → Await reply → Confirm later** (arrows between steps).
- A tiny trailing note: **No payment captured · merchant confirms later**.
- Low visual weight (pill, subtle 1px emerald border, translucent fill, smaller type), placed
  directly **below Local For You** so it does not compete with the hero, flagship cards, or
  classifieds. Wraps gracefully on narrow widths.

Copy (added under `localHub.statusFlow`, EN + VI; other locales fall back to EN):

- VI: `Gửi yêu cầu → Chờ phản hồi → Xác nhận sau` · `Không thu tiền · cửa hàng xác nhận sau`
- EN: `Request sent → Await reply → Confirm later` · `No payment captured · merchant confirms later`

No fake booking success or payment confirmation; the request-only / merchant-confirms-later
meaning is preserved.

## B. Classifieds image model

`LocalClassifiedsFeaturedPreview` now supports a future listing-photo concept safely:

- `LocalClassifiedsFeaturedPost` gained optional `imageUri?` / `imageUrl?`.
- In `renderCard`: if a listing image string is present and non-empty, the card uses it
  (`{ uri }`) as the card image with `objectPosition: center`; otherwise it falls back to the
  safe **category fallback art** (`getLocalHeroCardAsset(meta.heroKey)`) with the curated hero
  object-position. No upload/storage/backend is implemented; current static/demo posts (no
  image) render exactly as before.
- Preview cap preserved: desktop/tablet max 3, mobile max 1–2. Carousel/grid behavior, the
  "+N more" hint, Create Listing, and View All handlers are all unchanged.

## C. Fallback category art (defensive)

`resolveMeta` now maps a defensive category union to safe accent/icon/fallback art, and the
union accepts future strings (`string & {}`) so unrecognized categories never break the card:

| Category | Accent | Fallback hero art |
|----------|--------|-------------------|
| `hiring` / `jobs` | emerald | `myRequests` |
| `shop_transfer` / `business` | gold | `legalWealth` |
| `housing` | cyan | `bookingAssist` |
| `marketplace` | gold | `browseServices` |
| `services` | emerald | `browseServices` |
| `community` | violet | `default` |
| _(unknown)_ | emerald | `myRequests` |

No new image assets were added — fallbacks reuse the existing Local hero card art.

## D. Safety

- No guaranteed sale/hire/lease, no payment captured, no verified-listing claim.
- VIP highlight stays `demo` tone (Pilot/Demo); existing preview safety copy unchanged
  ("Preview only · Demo listings · No payment captured · No sale/hire/lease guarantee · VIP
  highlight is pilot-only").

## Handler preservation

`onCreateListing`, `onViewAll`, the "+N more" hint, and card `onPress` (→ View All) are all
preserved. No route or business-logic changes.

## Files changed

- `src/screens/b2c/LocalScreen.tsx`
- `src/components/viona/local/LocalClassifiedsFeaturedPreview.tsx`
- `src/i18n/locales/en.json`, `src/i18n/locales/vi.json` (compact flow copy)
- `docs/design/VIONA_WAVE_3B_LOCAL_STATUS_GUIDE_COMPACT_AND_CLASSIFIEDS_IMAGE_MODEL.md`
- `docs/design/evidence/wave-3b-local-final-hero-assets/*`

## Screenshot QA by viewport

See `docs/design/evidence/wave-3b-local-final-hero-assets/`.

- 390×844 — compact strip wraps cleanly below Local For You; no overflow.
- 768×1024 — single-line strip; classifieds preview capped; no white gutters.
- 844×390 — compact hero + light strip; no overflow.
- 1024×768 — strip light; classifieds capped at 3.
- 1366×768 — strip does not compete with hero/cards.

## Safety drift report

No IA broad changes, no routes/handlers, no payment/wallet/AI/SOS/backend/auth/merchant
logic, no upload/storage. Home, App.tsx, global.css, navigation/routes untouched.

## Commit status

NOT COMMITTED.
