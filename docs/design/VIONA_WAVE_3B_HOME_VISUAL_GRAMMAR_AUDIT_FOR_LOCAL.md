# VIONA Wave 3B — Home Visual Grammar Audit (for Local rebuild)

Pack: `VIONA.WAVE_3B.HOME_VISUAL_GRAMMAR_AUDIT_FOR_LOCAL.1`  
**Type:** Audit-only — no production code changes in this pack.  
**Visual reference:** `src/screens/HomeScreen.tsx` + `fashionHomeDesktopShell` + `VionaFashionWorldCard` (Home is the quality bar).

---

## Executive summary

Home (Fashion Home / web opening stage) establishes VIONA’s premium product language: **one cinematic hero**, **four photo-forward universe cards**, **restrained edge-lit glass**, and **utility quick-actions below** the primary story. Typography is bright on dark glass; semantic color lives in **edges, pills, and accents**—not milky card bodies.

Local today reuses some Home rail tokens but stacks a **reference command-center panel + four crystal tiles + multiple secondary grids** in the first viewport. It reads **denser and more dashboard-like** than Home, with **no equivalent living hero** and **competing tile luminance** before the user reaches service modules.

**Recommendation:** Rebuild Local’s top using Home’s grammar (dynamic hero → four flagship cards → compact quick actions), then keep existing functional modules **below** that opening stage.

---

## 1. Home structure audit

### Top-level layout (Fashion Home desktop web ≥769px)

| Zone | Component / pattern | Role |
|------|---------------------|------|
| **Fixed chrome** | `VionaFashionHomeCommandBar` | Brand, greeting, language, VIO wallet, safety, account, daylight toggle, fullscreen |
| **Opening stage** | `fashionDesktopWebOpeningStage` | Viewport-budgeted first screen: hero + world cards (+ hub peek on tall viewports) |
| **Living hero** | `desktopHeroFrameShell` + cover image | Cinematic stage; copy left, art center/right |
| **World strip** | 4× `VionaFashionWorldCard` | Primary universe entry points |
| **Quick actions** | `VionaGlassPanel` + `VionaQuickActionPill` grid/scroll | Secondary utilities (book, translate, AI, docs, …) |
| **Below fold** | Hub sections, charity, legacy dashboard, etc. | Tertiary content — not part of opening grammar |

**Shell:** `SafeAreaView` + `ScrollView`; command bar sits **outside** scroll on desktop web (`fashionShellOuter` with measured chrome height). Scroll top pad minimal (`FASHION_HOME_WEB_OPENING_STAGE_SCROLL_TOP_PAD_PX = 0`).

### Mobile / non-fashion paths

- Narrow width: world cards → **horizontal carousel** (`width ≤ 380px`) or 1-col / 2-col grid.
- Alternate hero: `ftHeroMain` — copy column + `ftVisualPanel` side-by-side when `width ≥ 980`.

### Bottom navigation relationship

- Home is a **tab root** (`TabHome`); bottom tab bar remains visible unless fullscreen.
- Scroll bottom padding includes breathing (`FASHION_HOME_SCROLL_BOTTOM_BREATHING_EXTRA_PX`) so last quick-action row clears tabs.
- Local uses `PremiumAppShell` with `withTabBarClearance` + optional `LocalMiniappDock` — different clearance model (see §5).

### Responsive breakpoints (Home world cards)

| Width | Card layout |
|-------|-------------|
| ≤380 | Horizontal carousel (~256–292px card width) |
| 381–500 | 1 column stack |
| 501–1023 | 2×2 grid (non-fashion) |
| ≥769 fashion shell | 4-across single row (measured row ~180px min) |
| ≥1024 (non-fashion) | 4-across |

**Sources:** `fashionHomeDesktopShell.ts`, `HomeScreen.tsx` (`useWorldCardCarousel`, `worldCardsDesktopSingleRow`).

---

## 2. Home hero audit

### Hero height (web opening stage)

Computed by `computeFashionHomeWebOpeningStageLayout()`:

- **Floor / cap:** `FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX` = **430**, `HERO_MAX_PX` = **494**
- Budget subtracts: command chrome (~98–112px), measured card row (~180px), gaps (~6px), optional hub peek (~112px tall viewports)
- **Aspect reference:** `FASHION_HOME_DESKTOP_HERO_ASPECT` = 1280/540 (~2.37:1) when not in fixed-height opening mode
- **Fullscreen:** extra trim/bonus constants adjust hero so cards + quick-action dock fit one viewport

### Text placement

- **Left rail:** eyebrow → headline → subtitle → CTA row → status strip
- **Readability scrim:** left band only — `desktopHeroReadabilityScrim` width **44%** (58% daylight), max 520–640px — **does not blanket full hero**
- **Web daylight:** radial scrim via `fashionHomeWebDaylightHeroTextScrimStyle()` on hero shell
- **Living hero:** image `object-position` ~**84% / 32%** (subject center-right); copy stays left

### Image / background

- Default: `viona-hero-human-constellation-1280x428.png`
- **Living overlay:** swaps to universe-specific heroes (local/travel/academy/business) on card hover; reverts ~900ms
- **Edges:** top gold line, cyan side/bottom accents, corner glints (daylight), `premiumFrameEdgeOverlay` + `premiumCrispEdgeStroke`

### CTA styling

- **Primary:** gold gradient fill (`desktopHeroCtaPrimary`), “Explore” → scroll to world section; web hover material + soft pulse shadow
- **Secondary:** glass outline (`desktopHeroCtaSecondary`) — watch overview
- **Status strip:** three inline pills (network / support / countries) — contained gold border tray, not full-width chips

### Visual weight & clutter control

- **One hero message** per viewport (living copy keyed to hovered universe or default)
- **No tile grid inside hero** — hero is narrative, not a bento
- Clock/region capsule: **top-right**, max 32% width — does not fight headline
- “Connected” chip: decorative, pointer-events none, bottom area

### Typography (desktop hero)

| Element | Size / style |
|---------|----------------|
| Eyebrow | 11px, letterSpacing 2, uppercase, semibold |
| Headline | daylight `#ffffff` + text shadow; responsive sm/xs below 720/520 |
| Subtitle | 15px medium, maxWidth 520, luminous muted white |
| CTA | Gold gradient primary; secondary glass |

---

## 3. Home card audit (four universe cards)

### Component

`VionaFashionWorldCard` — photo `backgroundImage` required for Home (`viona-home-card-*-v1.png`).

### Dimensions

- **minHeight:** 168px (grid), 172px (`heroRow` variant)
- **Host (daylight web):** `FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX` = **180**
- **Carousel cell width:** 256–292px
- **Desktop row:** `ftCardCellQuarter` — equal flex columns, `stretchInColumn` for matched heights

### Title / subtitle rhythm

- **Top row:** icon capsule (champagne icon, accent border) + title (2 lines) + subtitle (2 lines)
- **Status pill:** below copy, `VionaStatusPill` sm (`lite` | `pilot` | `demo` | `comingSoon`)
- **Footer:** optional hint + chevron (Home cards use status, not always chevron)

### Visual background

- **Full-bleed cover image** with `resizeMode: cover`
- **Daylight edge-lit mode:** `glassMaterialMode: 'edgeLit'` — **no constellation atmosphere wash** on card body
- **Left text scrim only** (~21% → 0% horizontal) — photo stays bright right side
- **Host cell** adds `fashionHomeWebDaylightWorldCardMaterialStyle` + glass layers from `renderWorldCardGlassLayers`

### Glow / border

- **Edge:** `inset 0 0 0 1px` accent (web) or 1px `borderColor` (native)
- **Outer:** `luminousCardShell` — shadowRadius **3**, accent-colored glow **0.12–0.14** opacity — **tight**, not fog
- **Optional `neonRim`:** animated pulse on shadow — still low radius
- **Hover (web):** magnetic offset + image scale via `fashionHomeWebWorldCardHostMotionStyle`

### Icon / image treatment

- Icons in **capsule** — semantic border color, hover brightens on edge-lit
- **Universe accent rail:** local=emerald, travel=cyan, academy=violet, business=gold

### CTA affordance

- Whole card is `Pressable` — navigates to universe
- No separate button inside card; status pill communicates readiness only

### Spacing

- Grid gap from layout pad; opening stage **6px** hero→card gap (`FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX`)
- **28px** breathing constant exists for non-opening desktop (`FASHION_HOME_WORLD_CARD_HERO_BREATHING_TOP_PX`) minus 6px lap

---

## 4. Home material audit (extracted rules)

### Glass fill

- **Canvas:** `FASHION_HOME_DAYLIGHT_CANVAS` = `rgb(13, 18, 28)` — lifted navy, not pure black
- **Command rail:** `FASHION_HOME_COMMAND_RAIL_GRADIENT` — near canvas, not separate panel color
- **Quick action strip:** `VionaGlassPanel` warm tone + daylight pill glass (`fashionHomeWebDaylightQuickActionPillGlassStyle`)
- **Cards (daylight):** image-forward; **no milky full-card gradient fill**

### Edge glow

- **Hero frame:** `FASHION_HOME_DAYLIGHT_FRAME_BORDER` / `FRAME_GLOW` via `premiumCrispEdgeStroke`
- **Cards:** semantic accent at **~14%** glow max (`ACCENT_LUMINOUS_GLOW`)
- **Restraint rule:** glow is **rim + shadow**, not large blurred rectangles behind content

### Border / rim

- 1px inset stroke on cards; hero uses frame overlay stack
- Quick actions: inner rim on hover (`fashionHomeWebDaylightQuickActionInnerRimStyle`)

### Shadow

- Hero CTA: small gold shadow pulse (4–6px radius)
- Cards: elevation 1, shadowRadius 3
- Avoid stacked multiple halos on same element

### Image dark overlay

- **Hero:** left scrim + bottom handoff gradient (~17–30% height) — not uniform darken
- **Cards:** horizontal text scrim only; optional footer scrim for chevron row
- **Forbidden pattern:** full-card `rgba` wash that kills photo punch (explicitly removed in edge-lit mode)

### Text contrast

- Headlines: `#ffffff` + subtle text shadow (daylight tokens)
- Subtitles: `FASHION_HOME_DAYLIGHT_SUBTITLE` / `premiumLuminousInk.subtitle`
- Status pills: readable label on tinted fill — **text carries meaning**

### Glow restraint (summary)

| Do | Don’t |
|----|--------|
| Edge-lit 1px borders | Thick cartoon borders |
| Left copy scrims | Full-card green/emerald fog |
| Semantic accent per feature | One accent for entire hub |
| Photo as hero of card | Procedural mesh as card background |
| Low-radius shadows | Large neon blobs behind text |

---

## 5. Local mismatch audit (vs Home)

**Compared surfaces:** `LocalScreen.tsx` hero slot (`LocalCommandCenterPanel` + 4× `PremiumAppTile`) vs Home opening stage.

| Issue | Observation |
|-------|-------------|
| **Too dense** | Command rail + panel header + 4 flagship tiles + safety chips + primary grid + classifieds + modals in one scroll — far more than Home’s opening stage |
| **Dashboard-like** | `PremiumTileGrid` sections with kickers (`PremiumSection`) resemble admin dashboards; Home separates **story** (hero) from **utilities** (pills) |
| **Missing true hero** | `LocalCommandCenterPanel` is a **glass panel with skyline SVG**, not a cinematic photographic/dynamic hero with single narrative |
| **Cards compete** | Flagship `PremiumAppTile` tiles use crystal shells + vector micro-scenes at similar visual weight to secondary tiles below — no clear “four universes” tier |
| **Photo vs procedural** | Home cards use marketing PNGs; Local relies on `LocalVectorMicroScene` / `LocalFlagshipMicroScene` — flatter, busier |
| **Hierarchy** | Home: Hero → Worlds → Quick actions. Local: Rail → Panel+Tiles → More tiles → Status legend → Services |
| **Glow** | Local command panel + reference glass adds rim/grid/refraction stacks; cumulative glow exceeds Home card restraint |
| **Text safe zones** | Home scrim protects left copy; Local tiles pack title + status + scene in same card footprint |
| **Bottom clearance** | Local adds miniapp dock + tab bar + extra bottom padding — correct functionally but reduces “opening stage” feel |

**What Local should preserve (move lower, not delete):**

- Request-only safety chips and compact status legend (Home puts analog in hero status strip — Local can keep but **smaller / below** quick actions)
- Service category grids, classifieds, booking flows, modals
- Command rail utilities (language, wallet, SOS) — align styling with Home bar, already partially shared

---

## 6. Local target blueprint

### A. Local dynamic hero

- **One** opening hero band modeled on Home `desktopHeroShell`:
  - Local-specific cover art (constellation / city / service network) — 1280×428 class aspect
  - Left rail: kicker `LOCAL`, headline, subtitle, **one primary CTA** (e.g. browse services or my requests)
  - Optional secondary CTA (safety / how it works)
  - **Trust strip** inline (request-only · no payment · pilot) — mirror `desktopHeroStatusStrip`, not three duplicate chips above tiles
  - Right: bright art; **no tile grid inside hero**
- Viewport budget similar to Home opening layout (hero min ~430px web when 4 cards below)
- Living hero optional later: hover Local/Travel/etc. not required for v1

### B. Four Local hero cards

- Match `VionaFashionWorldCard` grammar:
  - **Photo or dedicated PNG/SVG assets** (see dedicated micro-scene asset system) — not procedural JSX as final
  - My Requests, Booking Assist, Legal & Wealth, Community/Browse Services
  - Status pill per card (`requestOnly` / `demo` / `lite`)
  - Edge-lit glass host; left text scrim; min height ~168–180px
- Grid: 4-across desktop, 2×2 tablet, carousel narrow phone (reuse Home breakpoints)

### C. Compact quick actions row

- `VionaGlassPanel` or Home-equivalent strip **below** four cards
- 4–8 pills: restaurant, transit, housing, scanner, etc. — **utilities**, not flagship stories
- Horizontal scroll `<768px`; 2×4 grid mid desktop

### D. Existing modules below

- Current `PremiumSection` grids (restaurant, nails, events, …)
- Classifieds, commerce blocks, `LocalCommerceHubCapabilities`
- Modals, booking, wallet flows unchanged in position — only **demoted** below opening stage

---

## 7. File impact planning (next implementation pack)

### Likely touch

| File | Reason |
|------|--------|
| `src/screens/b2c/LocalScreen.tsx` | Reorder layout: hero → flagship row → quick actions → sections |
| `src/components/viona/local/LocalDynamicHero.tsx` (new) | Home-parity hero shell for Local |
| `src/components/viona/local/LocalFlagshipWorldCard.tsx` (new) or adapt `VionaFashionWorldCard` | Photo-forward flagship cards |
| `src/components/viona/local/LocalQuickActionStrip.tsx` (new) | Pills below flagships |
| `src/design/vionaLocalHomeParityTokens.ts` (new) | Local opening-stage spacing borrowed from `fashionHomeDesktopShell` |
| `src/design/vionaLocalFlagshipSceneAssets.ts` | Wire PNG scenes into flagship cards |
| `src/components/viona/local/LocalFlagshipSceneAssetLayer.tsx` | Asset renderer in cards |
| `src/i18n/*` | Only if new hero copy keys needed — **coordinate** i18n pack |

### Do not touch (unless explicit pack)

| File | Reason |
|------|--------|
| `src/screens/HomeScreen.tsx` | Home is reference — frozen |
| `src/components/viona/PremiumAppTile.tsx` | Production tile engine — risk to all hubs |
| Payment / wallet / AI / SOS core | Protocol |
| Other universe screens | Scope |
| Production routes / handlers | No behavior change in visual pack |

### Components to create (recommended)

1. `LocalOpeningStageLayout` — viewport budget memo (port Home `computeFashionHomeWebOpeningStageLayout` pattern)
2. `LocalDynamicHero` — narrative hero
3. `LocalFlagshipCardRow` — four cards
4. `LocalHubQuickActions` — secondary pills

### Risks

- **Regression:** Local has many `testID`s and flows tied to current tile positions — moving tiles breaks E2E unless IDs preserved on same actions
- **i18n:** New strings must go through translation files
- **PremiumAppTile coupling:** Flagship row might duplicate tile logic — prefer thin wrapper over forking tile engine
- **Art debt:** Without PNG assets, parity will fail QA — asset pack must land in parallel
- **Tab bar / dock:** Clearance math must be revalidated per viewport

### Acceptance criteria (next pack)

| # | Criterion |
|---|-----------|
| 1 | First viewport shows **hero + 4 flagship cards** without secondary service grid |
| 2 | Hero uses **left scrim + bright art**; no bento inside hero |
| 3 | Flagship cards match Home **min height, text scrim, status pill, edge glow restraint** |
| 4 | Quick actions row sits **below** flagships, styled like Home `VionaQuickActionPill` |
| 5 | Existing Local modules remain functional **below** opening stage |
| 6 | No payment-success / settled visual drift (request-only semantics) |
| 7 | Screenshot QA at 5 viewports; side-by-side with Home opening stage |
| 8 | `npx tsc --noEmit`, `npm run lint`, `npm run smoke` pass |

---

## Optional capture

Not run in this audit pack. To compare visually later:

```bash
# Home tab + Local universe — manual or scripted captures at 390×844, 844×390, 768×1024, 1024×768, 1366×768
# Evidence folder: docs/design/evidence/wave-3b-home-visual-grammar-audit-for-local/
```

---

## Source index

| Topic | Primary files |
|-------|----------------|
| Home layout | `src/screens/HomeScreen.tsx` |
| Home tokens / opening stage | `src/components/viona/fashionHomeDesktopShell.ts` |
| World cards | `src/components/viona/VionaFashionWorldCard.tsx` |
| Command bar | `src/components/viona/VionaFashionHomeCommandBar.tsx` |
| Local layout | `src/screens/b2c/LocalScreen.tsx` |
| Local panel | `src/components/viona/local/LocalCommandCenterPanel.tsx` |
| Tile tokens | `src/design/premiumTileVisualTokens.ts` |
| Local palette | `src/components/local/localConstellationTokens.ts` |
