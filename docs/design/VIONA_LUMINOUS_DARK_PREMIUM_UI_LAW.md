# VIONA Luminous Dark Premium UI Law

**Pack:** `VIONA.WAVE_3B.SEMANTIC_MULTICOLOR_LUMINOUS_UI_LAW.1`  
**Status:** **LOCKED (design law)** — prevents Cursor drift to old dashboard UI  
**Date (UTC):** 2026-05-24  
**Companion:** `VIONA_SEMANTIC_COLOR_MAPPING_V1.md`  
**Classification:** Visual governance — **not** production launch, **not** commercial/Global Active

**Reference direction (design-time):**
- North-star system overview (`viona_design_system_overview.png`)
- Luminous AI / glass reference (`glassmophism.jpg`)

**Core target:** dark premium glass · bright luminous text · semantic glow · compact premium app tiles · controlled multicolor feature accents.

---

## A. Typography law

| Tier | Rule | Token hint (`premiumLuminousInk`) |
|------|------|-----------------------------------|
| **Primary titles** | Luminous white / near-white; confident, not dim | `title` `#F8FAFC`, `titleBright` `#FFFFFF` |
| **Section labels / kickers** | Bright cool white or semantic accent ink | `sectionKicker`, accent `ink` from map |
| **Subtitles** | High-contrast cool white — **never muddy gray** | `subtitle` ≥ `rgba(226,232,240,0.88)` |
| **Disabled** | May be dimmer but **must remain readable** | `disabledReadable` ≥ 0.72 effective contrast |
| **Banned** | Low-contrast gray on dark glass (`rgba(148,163,184,0.45)` body copy, paragraph blocks) | — |

**Meaning:** copy packs and chips state safety/money truth; typography must not feel like a legacy admin theme.

---

## B. Glass law

| Required | Forbidden |
|----------|-----------|
| Dark navy/black glass (`#050B14` field, `premiumTileGlass` slabs) | Flat black panels |
| Subtle internal highlight / refraction edge | Opaque gray dashboard blocks |
| Luminous edge lines (semantic stroke) | Full-card neon wash on compact tiles |
| Contained corner wash per feature accent | Random rainbow blobs |

**Material stack:** `PremiumAppShell` canvas → section/frame → `PremiumAppTile` glass body.

---

## C. Tile law

| Element | Rule |
|---------|--------|
| Icon capsule | 32–44px (`premiumTileLayout.iconCapsuleSize`) |
| Title | Short, 1 line preferred |
| Subtitle | 1–2 lines max, luminous ink |
| Status | **Text chip required** — `PremiumStatusChip` |
| Grid | Compact `PremiumTileGrid`; 44px+ min press height |
| Touch | No icon-only ambiguity |
| Layout | **No long dashboard rows** on consumer hubs |

---

## D. Glow law

| Rule | Detail |
|------|--------|
| **Semantic only** | Glow follows `accent` feature meaning (stroke, corner wash, shadow) |
| **Atmosphere + features** | One **leading** hub wash + **controlled** per-tile accents |
| **Balance** | Do not glow every object equally |
| **Forbidden** | Random rainbow; monochrome universe blanket; magenta on normal commerce; gold implying paid |

See `VIONA_SEMANTIC_COLOR_MAPPING_V1.md` and `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` §5.4.

---

## E. Mobile law

| Rule | Detail |
|------|--------|
| **390 width** | No horizontal overflow — `width/maxWidth 100%`, `minWidth 0`, web `overflowX: hidden` |
| **Header** | Controls collapse / icon-only when needed; avoid desktop-heavy top rail |
| **Bottom** | Mandatory dock + tab clearance (`resolvePremiumShellBottomPadding`) |
| **Hero** | Compact on `<480` |
| **Grid** | 1-column when 2-column titles truncate; readability over density |
| **Readability** | Never sacrifice legibility for grid density |

---

## F. Old UI ban (Cursor must not reintroduce)

| Banned pattern | Replace with |
|----------------|--------------|
| Long dashboard rows | `PremiumAppTile` + `PremiumTileGrid` |
| Wide admin panels on consumer hubs | `PremiumHubLayout` sections |
| Dull gray text on dark glass | `premiumLuminousInk` |
| Giant explanation blocks | Short subtitle + chip |
| Dense paragraph cards | Compact tiles |
| Fixed desktop-only widths | Responsive rail + `%` cell basis |
| One-color monotony | Controlled semantic multicolor |
| Icon-only tiles | Icon capsule + text chip |
| Screen-by-screen random padding | `PremiumAppShell` + shell tokens |
| Patching hubs without reading mapping law | `VIONA_SEMANTIC_COLOR_MAPPING_V1.md` first |

---

## G. Drift protection (agent workflow)

Before editing any consumer hub screen:

1. Read `VIONA_SEMANTIC_COLOR_MAPPING_V1.md` for accent table.  
2. Read this document for typography/glass/mobile bans.  
3. Prefer `PremiumAppShell` / `PremiumHubLayout` / `PremiumSection` over bespoke scroll padding.  
4. Do **not** claim visual completion until screenshot QA records PASS/PARTIAL.  
5. Do **not** claim production, commercial, Global Active, or native PASS.

---

## H. Next implementation sequence

| Order | Pack | Status |
|-------|------|--------|
| 0 | `VIONA.WAVE_3B.SEMANTIC_MULTICOLOR_LUMINOUS_UI_LAW.1` | **This pack (docs law)** |
| 1 | `VIONA.WAVE_3B.PREMIUM_APP_SHELL_FOUNDATION.1` | **Complete** @ `659dcf4` |
| 2 | `VIONA.WAVE_3B.LOCAL_RECOMPOSE_TO_PREMIUM_SHELL.1` | Next |
| 3 | `VIONA.WAVE_3B.TRAVEL_RECOMPOSE_TO_PREMIUM_SHELL.1` | Planned |
| 4 | `VIONA.WAVE_3B.ACADEMY_RECOMPOSE_TO_PREMIUM_SHELL.1` | Planned |
| 5 | `VIONA.WAVE_3B.ACCOUNT_SOS_RECOMPOSE_TO_PREMIUM_SHELL.1` | Planned |
| 6 | `VIONA.WAVE_3B.MERCHANT_PREMIUM_WORKSPACE_PREVIEW.1` | Planned |
| 7 | `VIONA.WAVE_3B.SCREENSHOT_QA_CLOSEOUT.1` | Planned |

---

## I. Signoff

| Verdict | Meaning |
|---------|---------|
| **Law locked** | All Wave 3B UI packs must comply; violations are doc defects |
| **UI unchanged** | No screen pixels changed in this commit |

**Not claimed:** production readiness, commercial readiness, payment capture, SOS dispatch automation, AI autonomy.
