# VIONA.WAVE_3B.LOCAL_CLASSIFIEDS_CARD_GEOMETRY_AND_ALIGNMENT_FIX.1

Fix for the **uneven geometry** of the featured classifieds preview cards
(`LocalClassifiedsFeaturedPreview`). Visibility was already fine; the problem was width/gap/height
balance and rail alignment.

## Root cause

The grid used **fixed-percentage** cell widths (`cellTriple: 31.5%`, `cellDouble: 48.4%`) inside a
`flex-row` with `gap: 12`. Percentages are computed on the container width and **do not account for
the gaps**, so 3 cards = `3 × 31.5% + 24px = 94.5% + 24px` never matched the rail: on the wide
desktop rail this left ~40–50px of asymmetric dead space on the right (and a slightly ragged right
edge on tablet). It also did not guarantee equal heights. The result read as "uneven widths /
inconsistent gaps / different visual weight," even though every card is the same component.

## Fix — even flex columns + equal height

Mirrors the proven hero-card-row column model (`flexBasis: 0` + `flexGrow: 1`):

```
grid: { flexDirection: 'row', alignItems: 'stretch', gap: 12 }   // stretch = equal height
cell: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }   // every card shares the rail evenly
cellSingle: { flexGrow: 0, flexBasis: '100%' }                    // 1-post = full width
```

`flexBasis: 0 + flexGrow: 1` makes each card absorb its share of the rail **after** the 12px gaps
are subtracted, so 2-up and 3-up both fill the row with no dead space and identical widths. The old
`cellDouble` / `cellTriple` percentage styles were removed.

### Measured result (rendered `getBoundingClientRect`)

| Viewport | Cards | Each width × height | Gaps |
| --- | --- | --- | --- |
| 1366×768 | 3 | 437 × 168 | even 12px (x = 16 / 465 / 913) |
| 768×1024 | 3 | 232 × 168 | even 12px (x = 24 / 268 / 512) |
| 390×844 | 2 (carousel) | 300 × 168 | even |

All cards now equal width **and** equal height; the row's left edge (x=16 desktop) aligns with the
same content rail as the secondary sections / hero rail.

## Internal alignment / overlay

All three cards render through the same `LocalHomeParityCard`, so padding, icon position, badge
position, title/subtitle rails, border radius, border/glow, and lighting network (`classified`
tier) are already identical by construction. With equal width + equal height now enforced, the
internal rails line up across the three cards. Images, asset files, per-category `objectPosition`,
and scrim are unchanged (the card art lives in the shared card and is out of scope here) — the
family now reads consistently because geometry is uniform.

## Hierarchy preserved

Still featured preview cards: capped at 3 (desktop/tablet) / 2 (mobile carousel), no full feed, no
new effects. Visually balanced but not stronger than the top 4 hero cards.

## Handlers / logic preserved

`onCreateListing` (create listing), `onViewAll` (view all + card press), preview-cap logic
(`previewLimit`, `visiblePosts`, `hiddenCount`), VIP badge, and safety copy are all unchanged. Only
grid layout style tokens were edited.

## Responsive / safety

No horizontal overflow at any viewport (desktop right edge inside rail; tablet symmetric ~24px
margins; mobile carousel unchanged). No IA / route / handler / business-logic changes. No
payment/wallet/AI/SOS/backend/auth/merchant logic touched. `LocalScreen.tsx` not modified — the rail
was not the root cause; the grid distribution was.

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/local-classifieds-grid-{1366x768,768x1024,390x844}.png`
plus refreshed standard `local-final-hero-assets-*` captures.
