# VIONA AF.UI.1 — Action Grid Pattern & App-wide UI Audit

**Date:** 2026-05-10  
**Scope:** Design-system audit + reusable pattern planning **only** (no app refactor in this pack).  
**Constraints respected:** No route changes; no Stripe/Twilio/API/DB/Auth/payment/AI changes in this doc task; SOS **behavior** unchanged; Home **Dynamic Hero** unchanged.

---

## 1. Pattern definition (summary)

See canonical spec: [`docs/design/VIONA_ACTION_GRID_PATTERN.md`](../design/VIONA_ACTION_GRID_PATTERN.md).

**Intent:** Feature actions use **icon + title + short subtitle** on **dark navy** surfaces with **thin accent borders** and **responsive 2–3 column grids** on desktop/wide tablet; **1 column** (or cautious **2 column**) on mobile for safety-critical flows.

---

## 2. Screens / surfaces audited

Inventory based on `src/screens/**`, `src/components/viona/**`, and key hubs. Classifications are **visual/layout**, not product priority.

### 2.1 Already aligned or partially aligned

| Area | Location | Notes |
| --- | --- | --- |
| **SOS sheet** | `src/screens/b2c/SOSModal.tsx` | **Reference implementation:** responsive grid, per-card neon accents, web `calc` thirds on wide desktop. Matches approved SOS visual direction. |
| **Home — World Stage / universe cards** | `HomeScreen.tsx` + `VionaUniverseCard` | Large flagship cards with icon/title/subtitle; **horizontal / editorial** layout (not the same flexWrap math as SOS grid). **Partially aligned** — premium card language matches; grid density differs. |
| **Home — quick actions** | `HomeScreen.tsx` (`quickActionStrip`, `VionaQuickActionPill` / row) | **Horizontal chip strip** (scroll on narrow); icon + label; not full title/subtitle cards. **Partially aligned** — good scan pattern; could converge tokens/grid on desktop later. |
| **Home — utility shortcuts** | `HomeScreen.tsx` (`utilityRow`, `utilityChip`) | Row of chips with icon + label; **not** a card grid. **Partially aligned**. |
| **Travel hub — bento** | `src/screens/b2c/TravelScreen.tsx` | **Asymmetric bento** tiles (`BentoItem` + varied sizes). Strong “premium hub” feel; **different layout grammar** than uniform SOS-style grid — acceptable variant if tokens harmonize. |
| **Academy — situation picker** | `src/components/learning/adult/SituationGrid.tsx` | **2-column wrap grid** of text-forward chips (`width: '47%'`). Grid-like; **light theme**, not dark navy SOS shell — **partially aligned**. |
| **Design primitives** | `VionaSurface`, `VionaUniverseCard`, `VionaMiniAppCard`, `vionaTokens` | Foundation for surfaces, spacing, accents; **reuse** for a future `VionaActionCard` rather than one-off CSS. |

### 2.2 Still using vertical “feature lists” (primary migration candidates)

| Area | Location | Notes |
| --- | --- | --- |
| **B2C multiverse picker** | `src/screens/b2c/DashboardB2CScreen.tsx` | `miniAppList` is **`flexDirection: 'column'`** stack of `VionaMiniAppCard`. Strong content; **desktop would benefit** from 2–3 column grid for parity with SOS/Home direction. |
| **Concierge / assistant actions** | `src/screens/ConciergeScreen.tsx` | **Vertical** `assistantActions` stack (`primaryActionBtn` / `secondaryActionBtn`). Candidate for grid on wide layouts. |
| **Travel companion rows** | `src/screens/TravelCompanionScreen.tsx` | Repeated rows with pills — **vertical list** pattern. |
| **LifeOS dashboard actions** | `src/screens/LifeOSDashboard.tsx` | Mixed blocks; primary navigation/actions often **stacked** — candidate for grid where actions are discrete. |
| **Emergency SOS (legacy stack)** | `src/screens/EmergencySOSScreen.tsx`, `src/components/emergency/SOSModal.tsx` | Separate from **b2c SOS modal**; may still use older vertical patterns — align with product ownership before refactor. |
| **Vault — entry / CTAs** | `VaultScreen.tsx` | Mix of **document cards** (data) and actions; **do not grid document history**; optional grid for **top-level vault actions** only. |

### 2.3 Explicitly **do not** force Action Grid

| Area | Reason |
| --- | --- |
| `GlobalWalletScreen.tsx` — transaction list | **Data list** — rows + status chips. |
| `VaultScreen.tsx` — document cards list | **Content/data** items, not generic feature picks. |
| Chat / interpreter threads | **Conversation** UI. |
| Admin dashboards, tables, logs | **Tables / dense data**. |
| Settings screens with many toggles | **Settings pattern** — list + switches. |
| Local classifieds / commerce feeds | **Feed** of posts — not action grid. |

---

## 3. Recommended migration order (future packs)

1. **`DashboardB2CScreen`** — High visibility; pure feature choice; natural **2–3 column grid** on desktop without touching routes.
2. **Home `utilityRow` / optional quick-action desktop grid** — **AF.UI.x** must **exclude Dynamic Hero**; only shortcut strips.
3. **`ConciergeScreen`** assistant primary/secondary actions — low risk if copy unchanged.
4. **Travel companion / LifeOS** — audit copy + density per surface; avoid breaking booking flows.
5. **`CaNhanScreen`** — account shortcuts: migrate only **shortcut clusters**, not language/settings lists or GDPR tables.
6. **B2B merchant / import** — after B2C patterns stabilize; watch **touch targets** on narrow web.

**Not in top tier:** Transaction history, vault document list, chat, admin.

---

## 4. Reusable component recommendation

**Create (suggested name):** `VionaActionGrid` + `VionaActionCard` under `src/components/viona/`.

**Responsibilities:**

- Props: `columns` breakpoints or `{ wide: 3, medium: 2, narrow: 1 }`, `gap`, `children` or data-driven items.
- Card: `icon`, `title`, `subtitle`, `accent` (border + icon tint), `onPress`, `disabled`, optional subtle chevron.
- Implement **web** `calc`-based equal widths **or** shared `onLayout` measure (mirror SOS proven approach).
- Build on **`VionaSurface`** + **`vionaTokens`**; **do not** fork SOS honesty logic into generic component.

**Reuse today:**

- **`VionaUniverseCard`** — universe pastel/stage layouts; good for **large** entries, not dense SOS-style tiles.
- **`VionaMiniAppCard`** — rich mini-app descriptions; could remain inside grid cells or converge styling with Action Card over time.

**Do not** refactor SOS modal onto new primitive until **AF.UI.2+** explicitly schedules it (avoid regression).

---

## 5. Risk areas

| Risk | Mitigation |
| --- | --- |
| Gridding **payment confirm** or **destructive** actions | Keep **full-width** or **1-col** for critical paths. |
| **Mis-tap** on dense 3-column mobile | Enforce min height / width; SOS stays **1-col** on narrow web per current SOS rules. |
| **i18n string length** blowing card height | `numberOfLines` + `adjustsFontSizeToFit` caps (as SOS already does). |
| **Theme clash** (light hubs vs dark SOS) | Two token lanes: **trust/light** vs **fashion-tech dark** — pattern doc allows both if borders/accents disciplined. |
| Conflating **data lists** with **actions** | This audit list in §2.3 is the guardrail. |

---

## 6. Validation (docs-only task)

Run from repo root:

- `npm run typecheck`
- `npm run lint`

Record results in PR / release notes when implementing **AF.UI.2**.

---

## 7. Next suggested pack

**AF.UI.2 — `VionaActionGrid` primitive + pilot migration**

- Implement primitive + Storybook/web visual check (if available) or screenshot gate.
- Pilot **one** surface (recommend `DashboardB2CScreen` desktop grid).
- Explicit non-goals: Hero, SOS copy/behavior, backend.

---

## 8. Sign-off checklist (for PM / design)

- [ ] Pattern doc approved (`VIONA_ACTION_GRID_PATTERN.md`)
- [ ] Audit reviewed (`VIONA_AF_UI_ACTION_GRID_AUDIT.md`)
- [ ] Migration order agreed
- [ ] AF.UI.2 scope frozen (single pilot screen)
