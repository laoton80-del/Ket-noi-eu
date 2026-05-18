# VIONA.DESIGN_MODE_LOCK.1

**Document ID:** `VIONA.DESIGN_MODE_LOCK.1`  
**Type:** Design strategy lock (docs only)  
**Branch:** `pack-af18-design-mode-lock`  
**Base master:** `9f38c23`  
**Date:** 2026-05-16  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §1.1, [Global Active/Full lock](../audit/VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md).

**Lock statement:** **Dark mode** is the **primary VIONA product / app UI** standard. **Light mode** is **presentation-only** (marketing, decks, posters, partner/investor materials) — **not** a full in-app theme for production surfaces at this time.

---

## 1. Product context

VIONA’s target state is **Active / Full globally** for the entire app. Visual design must support that scope without shrinking universes or converting the live product into a light “infographic” experience.

| Mode | Role |
|------|------|
| **Dark / Product UI** | What users run daily in the app — LifeOS, hubs, SOS, wallet entry, merchant tools. |
| **Light / Presentation UI** | How we **explain** VIONA externally — decks, landings, architecture maps, KPI overviews. |

**Lite / Pilot / Demo** labels on features describe **readiness gates**, not “use light mode in the app for this market.”

---

## 2. Dark mode — Product UI (primary)

### 2.1 Identity

- **Dark mode is VIONA app identity** — midnight / deep navy canvas, ivory typography, semantic accent families (gold, cyan, emerald, magenta-for-SOS only).
- Keep **Premium dark glass** + **semantic glow** + **Premium App Tiles** as the consumer-hub language.
- Align implementation with existing doctrine:
  - [`VIONA_HUMAN_CONSTELLATION_DESIGN_SYSTEM.md`](./VIONA_HUMAN_CONSTELLATION_DESIGN_SYSTEM.md)
  - [`VIONA_NEON_GLASS_CARD_SYSTEM.md`](./VIONA_NEON_GLASS_CARD_SYSTEM.md)
  - [`VIONA_GLASS_LIGHT_POLISH_SYSTEM.md`](./VIONA_GLASS_LIGHT_POLISH_SYSTEM.md) — *polish on dark glass*, not a global light theme
  - [`VIONA_ACTION_GRID_PATTERN.md`](./VIONA_ACTION_GRID_PATTERN.md)

### 2.2 Premium App Tiles (consumer hubs)

Use **Premium App Tiles** on consumer-facing hubs (Home multiverse, Travel, Local, Academy entry, high-visibility quick actions) unless a screen is explicitly data-dense.

Each tile should include:

| Element | Requirement |
|---------|-------------|
| **Icon** | Large, recognizable, universe- or intent-aligned |
| **Title** | Short, scannable |
| **Subtitle** | One concise line — not a paragraph |
| **Semantic glow** | Accent keyed to intent (see glass/glow hierarchy) |
| **Glass depth** | Translucent surface, thin luminous edge, inner lift |
| **Grid** | App-like grid — **not icon-only** strips |
| **Hero tiles** | Important quick actions may use **larger hero tiles** |

**Anti-patterns:** icon-only grids without titles; flat white cards; per-page random dominant colors; nightclub / gaming motion; light infographic styling inside the app.

### 2.3 Density exceptions

| Surface | Guidance |
|---------|----------|
| **B2B / merchant / admin** | May stay **denser** — tables, ledgers, catalogs, ops queues |
| **SOS / safety** | Serious, calm, red/magenta reserved — see Operating Protocol §17.1 |
| **Checkout / wallet** | Trust-first, honest readiness labels; no fake success chrome |

### 2.4 What dark product UI must not become

- Do **not** convert the app into **light infographic** or corporate poster style.
- Do **not** ship a **global light theme toggle** as production default without an explicit founder-signed initiative that supersedes this lock.
- Do **not** remove functions or universes to simplify visuals.

---

## 3. Light mode — Presentation UI (secondary)

### 3.1 Scope

Light mode is **not** full app mode **for now**. Use only for:

| Artifact | Purpose |
|----------|---------|
| **Pitch deck** | Investor / partner narrative |
| **A3 ecosystem poster** | One-glance universe map |
| **Landing page overview** | Public positioning |
| **Investor / partner brochure** | Trust, roadmap, modules |
| **Public architecture map** | Ecosystem + Smart Trio / language strategy |

### 3.2 Visual character

- **Clean, bright, corporate, readable** on print and projector.
- May show **ecosystem**, **roadmap**, **modules**, **trust**, **KPIs**, **global language strategy**.
- May use simplified diagrams and module cards — clarity over glass depth.

### 3.3 Boundaries

- Presentation assets **must not** imply fake production (live dispatch, payment captured, booking confirmed, verified badges without backend).
- Presentation may show **Lite / Pilot / Demo / Coming Soon** honestly on module cards.
- **Do not** use presentation light layouts as the spec for in-app screen refactors unless a separate UI pack explicitly scopes a **dark** implementation.

---

## 4. Shared rules (all modes)

| Rule | Detail |
|------|--------|
| **Public brand** | **VIONA** only — no public **KNG**, **ViGlobal**, **VIG Token** |
| **Public points** | **VIO Points** / **VIO Credits** — in-app loyalty units; not cash, crypto, or withdrawable in product copy |
| **No fake production** | No emergency dispatch, GPS-to-authorities claims, payment success theater, refund guarantees, or verified status without SoT |
| **Universe scope** | Do **not** remove functions from any universe for visual simplification |
| **Global scope** | Design choices must not signal “demo-only market” — see [Global Active/Full lock](../audit/VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md) |
| **Accessibility** | Contrast and tap targets win over effect — reduce blur or raise fill when legibility fails |

---

## 5. Agent / pack instructions

When implementing UI:

1. **Default to dark product UI** for app screens, components, and tokens.
2. **Reference** Neon Glass + Action Grid + Human Constellation docs before inventing new card languages.
3. **Reserve light layouts** for `docs/`, marketing exports, and deck assets — not drive-by app reskins.
4. **Name packs** (e.g. `AF.UI.*`) and allowlist files; Class B review for routing/shell if navigation chrome changes.

---

## 6. Related documents

| Document | Relationship |
|----------|----------------|
| `VIONA_OPERATING_PROTOCOL.md` | Trust, SOS, B2B, no-fake production |
| `VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md` | Global product scope |
| `VIONA_GLASS_LIGHT_POLISH_SYSTEM.md` | Glass polish **on dark** surfaces |
| `VIONA_FASHION_TECH_VISUAL_SYSTEM.md` | Home / fashion-tech reference |
| `VIONA_I18N_GLOBAL_LANGUAGE_STRATEGY_AUDIT_1.md` | Smart Trio / locale — copy layer separate from mode |

---

## 7. Validation (this pack)

| Check | Expected |
|-------|----------|
| App source changed | **No** |
| Locale JSON changed | **No** |
| Docs only | **Yes** |

---

## 8. Confirmations

| Question | Answer |
|----------|--------|
| Dark = primary app UI? | **Yes** |
| Light = presentation only (for now)? | **Yes** |
| Premium App Tiles on consumer hubs? | **Yes** — where appropriate |
| App logic / routes / backend changed? | **No** |

---

*End of lock — `VIONA.DESIGN_MODE_LOCK.1`*
