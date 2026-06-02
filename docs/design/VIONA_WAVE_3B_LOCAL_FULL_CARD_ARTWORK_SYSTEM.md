# VIONA Wave 3B — Local Full Card Artwork System (Audit + Prep)

**Pack:** `VIONA.WAVE_3B.LOCAL_CARD_SIZE_AUDIT_AND_FULL_ARTWORK_PREP.1`
**Status:** **READY FOR REVIEW** — audit + registry + support wiring; **NOT COMMITTED**
**Baseline:** `5d68179` (background registry) + `6e52d50` (card hierarchy)
**Visual north star:** VIONA six-universe command-center reference (uploaded) — Local emerald/cyan atmosphere, **multicolor semantic accents per card**, luminous modules not flat dashboard tiles.

---

## Reference findings (command-center image)

| Finding | Current Local gap | Target direction |
|---------|-------------------|------------------|
| Inner scenes are **large and very bright** | Micro-scene slot **112×76px** (~30% of compact tile footprint); low slot opacity | Scene occupies **55–65%** of card; higher luminance under controlled veil |
| Card borders **brighter / cleaner** | `edgeWidth: 2`, stroke opacity ~0.7–0.85 on accents | Stronger stroke + frame glow on hero/primary; tiered intensity |
| Cards feel like **premium luminous modules** | Readable but “app tile” proportion (short, icon-led) | **Mini-poster** proportion — taller, scene-first |
| Each card = **mini world**, not tiny icon | 44px icon capsule dominates top band | Scene is hero; icon capsule optional or smaller on artwork swap |
| **Not monochrome** | Local already uses emerald/cyan/violet/gold accents | Preserve semantic multicolor; artwork must not flatten to one hue |
| **Not flat** | Glass + corner wash present | Add brighter interior bloom + stronger outer halo on action tiers |

**Rendering law (all full-card PNGs):**

- Visual layer only — **no baked text, buttons, chips, or fake status**
- **No payment claim** (paid / settled / payout / escrow / guaranteed booking)
- **No SOS dispatch** implication
- Title, status chip, subtitle, handlers remain **real code**
- Local safety copy unchanged: **REQUEST-ONLY**, **NO CHARGE**, **NO PAYMENT CAPTURED**, **CONFIRMED ≠ PAID**

---

## 1. Current layout audit (code baseline)

**Source of truth:** `premiumTileVisualTokens.ts` (`premiumTileLayout`, `premiumTileMicroSceneLayout`), `PremiumAppTile.tsx`, `LocalScreen.tsx`.

### Measured / derived proportions (typical)

| Surface | Component | Width @390 | Width @1024 | Min height | Approx. aspect (W:H) | Scene area today |
|---------|-----------|------------|---------------|------------|----------------------|------------------|
| Hero actions | `PremiumAppTile` `size="hero"` | ~100% rail (~366px) | ~48–52% row (~500px primary cell) | **168px** | **~2.2:1** (too wide/flat) | Vector/PNG corner **112×76** (~17% of card area) |
| Primary grid (4) | `PremiumAppTile` compact | ~47.5% (~174px) 2-col | ~23% (~240px) 4-col | **108px** | **~1.6:1** (too flat) | Corner slot ~35% of footprint |
| Secondary grid | `PremiumAppTile` compact | 1-col phone / 2-col+ | same | **108px** | **~1.6:1** | Same |
| Quick help | `Pressable` strip | 100% | 100% | ~44–52px content | wide strip | **no scene** (text row) |
| Compact status | `LocalHubCompactStatusGuide` | 100% | 100% | ~72–96px content | legend strip | **12px icons only** — not poster-ready |
| Trust hero intro | `LocalConstellationFrame` | 100% | 100% | content-driven | N/A | chips only (correct tier) |

**Gaps (concrete):**

| Issue | Affected cards | Severity |
|-------|----------------|----------|
| **Too short** | All hero + primary + secondary `PremiumAppTile` | **High** — 108px compact vs ~140–160px target mobile |
| **Too flat** | Hero (168px tall but very wide), primary/secondary in multi-column | **High** — reads as dashboard row not poster |
| **Scene area too small** | All tiles using `PremiumTileMicroScene` / `microSceneKey` | **High** — 112×76 corner vs 55%+ card coverage |
| **Border/glow too soft** | Primary/secondary vs reference modules | **Medium** — frameGlow 0.72, halo 0.38 |
| **Wrong visual hierarchy** | Compact status vs action tiles | **Low** — status correctly lightweight; needs optional mini-art later |
| **Aspect ratio** | Hero should be taller; primary closer to **4:5** portrait module | **High** |

**Cards that need larger visual area first (priority):**

1. Hero — browse services, booking assist
2. Primary — restaurant, transit, legal & wealth, my requests
3. Secondary — nails, events, housing, classifieds, document scanner
4. Compact status legends — request sent, merchant review/declined, confirmed-not-paid (future mini tiles or strip art)

---

## 2. Card tier system (target spec — next visual swap pack)

### A. Hero

| Property | Mobile (390) | Tablet (768+) | Desktop (1024+) |
|----------|--------------|---------------|-------------------|
| **Aspect ratio** | **16:10** min (prefer **3:2** module) | 16:10 | 2:1 max width in split row |
| **Min height** | **220px** (current 168) | **200px** | **220px** |
| **Text zone** | **28–32%** top/left safe band | 30% | 28% |
| **Visual scene** | **62–68%** | 65% | 65% |
| **Border** | `edgeWidth` 2.5; stroke at hover spec | same | same |
| **Glow** | frameGlow **0.88**, halo **0.48**, shadow radius **28** | same | +4px lift |
| **Radius** | **18** (`radiusHero`) | 18 | 18 |
| **Accent** | **Strong** semantic (emerald browse, cyan assist) | strong | strong |

### B. Primary

| Property | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| **Aspect ratio** | **4:5** (portrait-leaning module) | 5:6 | 1:1 acceptable in 4-col |
| **Min height** | **140px** (current 108) | **132px** | **128px** |
| **Text zone** | **32–36%** | 34% | 32% |
| **Visual scene** | **58–62%** | 60% | 58% |
| **Border** | edge 2; stroke **0.8** opacity | same | same |
| **Glow** | frameGlow **0.82**, halo **0.42** | same | slightly softer than hero |
| **Radius** | **16** | 16 | 16 |
| **Accent** | **Strong** per feature (emerald/cyan/violet/gold) | strong | strong |

### C. Secondary

| Property | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| **Aspect ratio** | **3:4** to **4:5** | 4:5 | 5:6 |
| **Min height** | **128px** | **120px** | **116px** |
| **Text zone** | **34–38%** | 36% | 36% |
| **Visual scene** | **52–58%** | 55% | 52% |
| **Border** | edge 2; stroke **0.72** | same | same |
| **Glow** | frameGlow **0.76**, halo **0.36** | softer than primary | softer |
| **Radius** | **16** | 16 | 16 |
| **Accent** | **Softer** wash; semantic accent preserved | softer | softer |

### D. Compact status

| Property | Value |
|----------|--------|
| **Form** | Single strip (current) or future **4 mini legend cells** |
| **Aspect** | **6:1** strip or **2:1** per legend cell |
| **Min height** | Strip **72px**; mini cell **56px** |
| **Text zone** | **55–60%** (copy-first) |
| **Visual scene** | **25–35%** — small bright glyph/scene, not full poster |
| **Border** | hairline / 1px emerald wash (current) |
| **Glow** | minimal — **no** hero-level halo |
| **Accent** | **Softer emerald** only; safety semantics in **text** |

**Accent rule:** use **strong** accents on hero + primary when meaning is actionable (browse, request, my requests). Use **softer** accents on secondary discovery and compact status. Never use gold/magenta to imply paid or emergency dispatch.

---

## 3. Full artwork inventory (Local v1)

**Folder:** `assets/viona/card-artwork/local/`
**Registry:** `src/design/vionaLocalCardArtworkAssets.ts`

| Artwork key | Tier | Local surface (testID / strip) |
|-------------|------|--------------------------------|
| `local-browse-services` | hero | `local-cta-browse-services` |
| `local-booking-assist` | hero | `local-cta-booking-assist` |
| `local-restaurant-services` | primary | `local-tile-restaurant` |
| `local-transit-mobility` | primary | `local-tile-transit` |
| `local-legal-wealth` | primary | `local-tile-legal-wealth` |
| `local-my-requests` | primary | `local-tile-my-requests` |
| `local-nails-beauty` | secondary | `local-tile-nails` |
| `local-community-events` | secondary | `local-tile-events` |
| `local-housing-home` | secondary | `local-tile-housing` |
| `local-classifieds-market` | secondary | `local-tile-classifieds` |
| `local-document-scanner` | secondary | `local-tile-legal-scanner` |
| `local-request-sent` | compactStatus | legend `legendRequestSent` |
| `local-merchant-review` | compactStatus | legend `legendMerchantConfirmed` |
| `local-merchant-declined` | compactStatus | legend `legendMerchantDeclined` |
| `local-confirmed-not-paid` | compactStatus | legend `legendConfirmedNotPaid` |

**On disk:** `.gitkeep` only — **0 PNGs**. No placeholders.

**Related micro-scene keys** (`assets/viona/micro-scenes/local/`) remain the **interior corner** system until full posters ship; after artwork swap, micro-scenes may be retired per card or kept as fallback.

---

## 4. Support wiring (this pack)

| Piece | Behavior |
|-------|----------|
| `getVionaLocalCardArtworkImageSource(key)` | Returns PNG source or **null** |
| `PremiumAppTile` `fullCardArtworkKey` | Renders `VionaLocalCardArtworkLayer` **only when PNG exists** |
| `LocalScreen` | Passes `fullCardArtworkKey={resolveLocalHubCardArtworkKey(testID)}` on hub tiles |
| Vector `microScene` / `microSceneKey` | **Unchanged** — still visible until PNGs activate |

**Not in this pack:** min-height changes, glow token changes, scene scale changes (documented above for **next pack**).

---

## 5. Spacing / safe-area notes (current)

| Token | Value | Note |
|-------|-------|------|
| `gridGap` | 16px hero/primary | OK; may increase to 18 on desktop with taller cards |
| `gridGapTight` | 12px secondary | OK |
| Tile padding | 12×12 | Text safe area tight for poster swap — consider **14** vertical on hero |
| `titleMaxLines` | 1 | OK for poster tier |
| `subtitleMaxLines` | 2 | OK |
| Icon row | 44px min | Competes with scene — shrink to **36** on artwork-active tiles in swap pack |

---

## 6. Next steps

1. **Design:** Export 15 textless full-card PNGs per tier aspect guides above.
2. **Import:** Drop into `assets/viona/card-artwork/local/`, uncomment `require()` lines in registry.
3. **Visual swap pack:** Apply tier min-heights, scene scale, border/glow tokens; optionally reduce icon dominance.
4. **QA:** Re-capture 5 viewports; verify readability + safety copy + no payment drift.
5. **Commit** after sign-off (separate from this prep pack).

---

## Art direction reset (`LOCAL_CARD_ART_DIRECTION_RESET.1`)

**Decision:** Full-card photorealistic posters are **disabled** for Local golden reference (`VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED = false`).

| Approach | Status |
|----------|--------|
| `VionaLocalCardArtworkLayer` (full bleed poster) | **Dormant** — keep registry for optional future batch; not used in Local UI |
| Code-driven shell (border, glow, inner rim) | **Active** — tier glow via `fullCardArtworkKey` |
| Prominent micro-scene band (lower **45–60%**) | **Active** — vector + PNG micro-scene when imported |
| Corner micro-scene (112×76) | Fallback for non-Local tiles |

**Capture:** `node scripts/capture-local-card-art-direction-reset.mjs` → `docs/design/evidence/wave-3b-local-card-art-direction-reset/`

## Visual swap pack evidence (`LOCAL_FULL_CARD_ARTWORK_VISUAL_SWAP.1`)

**Status:** Tier heights + glow applied on Local hub tiles via `fullCardArtworkKey`. **0/15 PNGs** on disk — vector micro-scenes remain until import.

**Capture:** `node scripts/capture-local-full-card-artwork.mjs` → `docs/design/evidence/wave-3b-local-full-card-artwork/`

**Activated requires:** none (await PNG batch in `assets/viona/card-artwork/local/*-card-v1.png`).

## Commit gate

**NOT COMMITTED** — await PNG import + visual approval.
