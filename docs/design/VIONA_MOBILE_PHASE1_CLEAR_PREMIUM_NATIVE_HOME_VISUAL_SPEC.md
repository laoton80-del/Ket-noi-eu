# VIONA Mobile — Phase 1 Clear Premium Native Home Visual Spec

**Document type:** Planning-level visual specification (docs only).
**Governs:** Proposed future **native iOS/Android** Home presentation after Phase 0 isolation.
**Does not govern:** Current web Fashion-Tech / luminous-dark UI (preserved).
**Does not authorize:** Runtime, token activation, asset creation, or design-lock mutation.

**Parent plan:** `docs/product/VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_ARCHITECTURE_MASTER_PLAN.md`

```text
PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED
```

Distinguish **CURRENT** (in repository today) from **PROPOSED** (planning-only; not runtime-bound). Do not treat proposed values as canonical product UI.

Canonical typeface **CURRENT:** Montserrat via `src/theme/typography.ts`.

---

## 1. Dark-lock coexistence

**CURRENT (docs lock, unchanged):** `docs/design/VIONA_DESIGN_MODE_LOCK.md` — dark is primary product UI.

**PROPOSED:** native-only light-first Home **carve**, mapped only inside `VionaNativeHomeOpeningStage` (and sibling native Home modules) **after** Phase 0 isolation exists.

Web desktop / web mobile / web tablet keep `fashionTech` + Wave 3B. Do not restyle `VionaFashionHomeAdaptiveComposition` or `VionaFashionWorldCard` in place.

---

## 2. Home composition

**PRIMARY:** Universe launcher (2×2 phone portrait).
**SECONDARY:** Find / Ask.
**TERTIARY:** Quick actions and contextual modules.

Vertical stack (phone portrait):

1. Contextual header
2. Find / Ask
3. Universe launcher
4. Quick-action preview
5. Companion (if real)
6. Discovery (if real)
7. AI optional
8. Care / legacy / secondary
9. Persistent four-tab nav + SOS shell (not Home-owned)

Short identity treatment only. No full-bleed Fashion-Tech hero as the first-screen story.

---

## 3. Module hierarchy (visual)

| Module | Elevation | Density | Accent |
|---|---|---|---|
| Header | Flat on canvas | Compact | Neutral ink |
| Find / Ask | One surface | Single field + chip | Neutral; Ask uses violet **meaning** only |
| Universe tiles | Highest Home content | 2×2 / 4-across | One leading accent per tile |
| Quick actions | Lower than tiles | Compact | Semantic by action, restrained |
| Companion / discovery | Same as content cards | Sparse | Neutral or one context accent |
| AI card | Quiet | Small | Violet meaning; Beta chip |
| Care | Utility | Secondary | Coral/care, not SOS magenta-as-commerce |

One leading accent **per module**. No glow stacks.

---

## 4. Component visual anatomy

### Header (`VionaNativeHomeHeader`)

- Compact VIONA wordmark or lockup (not a second hero).
- Greeting line + optional locale/time cue.
- No Account button that duplicates shell ownership.
- Bottom: 8pt gap before Find.

### Find / Ask (`VionaNativeHomePrimaryEntry`)

- Full-width field: placeholder honest (“Find Local, Travel, Academy…” planning copy; localize later).
- Optional Ask chip trailing, labeled, 44–48 min.
- Disabled/unavailable Ask: visible but non-dominant; core Find still works.
- No autocomplete of fake inventory.

### Universe launcher (`VionaNativeUniverseLauncher`)

Each tile: image crop, title, one readiness **text** chip, whole-tile press, optional tiny semantic rail (not neon).

### Quick actions (`VionaNativeQuickActions`)

Icon + label; 44–48; 2×2 or 1×4 preview; More overflow. SOS item uses safety semantics, not a product tile look.

### Companion / discovery

Title + 1–2 real items or **unmount**. No skeleton-of-fake-trips.

---

## 5. Card anatomy

### UNIVERSE TILE

Image (RE-CROP existing daylight art) · title · chip · press scale ~0.98 (PROPOSED motion) · radius CURRENT `lg`/`xl` (16–20).

### ACTION CARD

Icon capsule · label · no photography · radius CURRENT `md`.

### STATUS CARD

Title · honest status text · optional chevron · no fake metrics.

### DISCOVERY CARD

Image optional · title · source honesty (Demo if demo) · hide section if empty.

### ACCOUNT / ACTIVITY CARD

Icon · title · chevron · no promo art · real counts only.

### AI ASSIST CARD

Persona + Beta/Gated · short prompt · confirm before cost path.

SOS sheet chrome is specified in existing SOS docs; **not** a Home card family.

---

## 6. Buttons and chips

**CURRENT:** Fashion-Tech pills, champagne, glass hosts.

**PROPOSED native Home:**

- Primary button: solid ink or one semantic fill; label 16 semibold; 44–48 height.
- Secondary: outline / quiet fill.
- Chip: text + optional dot; readiness never icon-only.
- SOS chrome: existing hold control; linear fill; no bounce.

---

## 7. Typography hierarchy

**CURRENT family:** Montserrat 400/500/600/700/800.

| Role | PROPOSED use on native Home | Weight |
|---|---|---|
| Display | Rare; not first-screen hero poem | Bold, used sparingly |
| Page title | Greeting / “Home” if needed | Semibold–bold |
| Section title | Launcher / actions headings | Semibold |
| Body | Find helper, companion copy | Regular |
| Metadata | Time / locale cue | Regular 13-ish |
| Caption | Image credits none; chip text | Medium |
| Button | Actions | Semibold |
| Status | Readiness chips | Medium; not color-only |

Premium from size steps and space, not ExtraBold everywhere.

---

## 8. Semantic color principles

**CURRENT:** Wave 3B luminous accents on dark glass; `fashionTech` champagne.

**PROPOSED native meanings (not runtime hex lock):**

| Domain | Leading family |
|---|---|
| Travel | cyan / sky / blue |
| Local | emerald / teal / contextual warm |
| Academy | violet / indigo |
| Business | navy / gold / emerald |
| Account | neutral / premium gold |
| SOS | red only when genuinely critical |

Do not run all four universe accents at full chroma in the header. Tiles carry accent; page canvas stays calm.

---

## 9. Light-first proposed surfaces

**PROPOSED (not activated)** — prefer mapping from **CURRENT** light subset in `vionaTokens.colors` (`cloud`, `mist`, `white`, `ink`, `surface`, universe light `bg`):

| Token idea | Role | CURRENT anchor |
|---|---|---|
| `bg.canvas` | Page | `cloud` / `mist` |
| `bg.surface` | Cards | `white` / `elevatedSurface` |
| `bg.elevated` | Sheets | `elevatedSurface` |
| `ink.primary` | Text | `ink` |
| `line.subtle` | Borders | `colors.border` |
| `bg.critical` | SOS sheet | `colors.safety.bg` |

Glass: **restrained**. Prefer solid light surfaces on native Home. Web may keep dark glass.

---

## 10. Image treatment

- Hero constellation asset: **RE-CROP_LATER** or **REPLACE_LATER**; not a tall cover on first screen.
- Universe PNGs: **KEEP** / **RE-CROP_LATER**; cover crop; no fake “booked” badges on photos.
- Overlays: light scrim if needed for type; not Fashion-Tech 0.72 dark wash as default.
- No new assets in this packet.

---

## 11. Spacing and rhythm

**CURRENT:** `vionaTokens.spacing` 8pt grid.

**PROPOSED:** keep 8pt; increase **empty canvas** between modules vs stacked glass strips. Page pad consistent with current `layout.pad` spirit. Section gap > card internal gap.

---

## 12. Shadows, radius, dividers, icons

- Radius: CURRENT `lg`/`xl` cards; `md` buttons; `pill` chips.
- Shadows: PROPOSED soft, low; no stacked glow.
- Dividers: hairline `line.subtle` or space-only.
- Icons: Ionicons **CURRENT**; one optical size per row; SOS shield remains safety, not sparkles.

---

## 13. Responsive rules

| Canvas | Launcher | Find | Actions | Hero |
|---|---|---|---|---|
| Phone portrait | 2×2 | Full width | 2×2 or peek row | Short / none |
| Phone landscape | 4-across compact | Compact inline | Single row | Collapsed |
| Tablet portrait | 4-across larger | Full / wide | Row of 4–6 | Moderate identity only |
| Tablet landscape | Left pane 2×2 or 4 | Top of left | Row | None; two-pane |

Never: web desktop command bar, hover daylight network, `web-desktop` shell.

Safe areas on all four. Max readable width on tablet landscape (bounded column, not full-bleed).

---

## 14. Accessibility

Order: header → Find → launcher tiles (name + chip) → actions → below-fold. 44–48 targets. Contrast ≥ 4.5:1 on PROPOSED light surfaces. Dynamic type. Reduced motion: no bounce; SOS hold linear. Labels on icon controls. SOS not truncated. Landscape and tablet included in acceptance.

---

## 15. Loading / empty / error / success

| State | Rule |
|---|---|
| Loading | Quiet placeholder; no fake trips/prices |
| Empty companion/discovery | **Unmount** section |
| Empty Find | Honest “no results” only after real query |
| Error | Retry; universes still tappable |
| Success | Only for real user-completed actions; not decorative checkmarks on Home |

---

## 16. AI states

Entry chip · unavailable (universes still work) · Beta/Gated · loading with cost guard · confirm before call/tools. Minimized AI must not cover SOS.

No assumption AI is always available.

---

## 17. SOS awareness

Shell owns hold + modal. Home may use a quiet “Safety is in the bar” cue or keep the existing **entry** that calls `triggerSafetyAssist`.

Visual: not a world tile; not commerce coral/magenta confusion; not a second progress-hold ring on Home.

---

## 18. Written wireframes

### Phone portrait

```text
┌─────────────────────────┐
│  VIONA    greeting      │  header
│  Find          [Ask]    │  secondary
│  ┌─────┐ ┌─────┐        │
│  │Local│ │Travel│       │  PRIMARY
│  └─────┘ └─────┘        │
│  ┌─────┐ ┌─────┐        │
│  │Acad.│ │Bus. │        │
│  └─────┘ └─────┘        │
│  [Req] [More…]          │  tertiary peek
│  …scroll…               │
│  Home Local Travel Acad │  tabs
│              (SOS host) │
└─────────────────────────┘
```

### Phone landscape

```text
┌──────────────────────────────────────────┐
│ VIONA  greeting     Find          [Ask]  │
│ [Local][Travel][Academy][Business]       │
│ [Req][Translate][AI][More]               │
│ safe areas · tabs · SOS                  │
└──────────────────────────────────────────┘
```

### Tablet portrait

```text
┌─────────────────────────────────┐
│ Header + Find/Ask               │
│ [L] [T] [A] [B]   larger tiles  │
│ actions row                     │
│ optional: companion column      │
│ tabs + SOS · no command bar     │
└─────────────────────────────────┘
```

### Tablet landscape

```text
┌────────────────┬────────────────┐
│ header, Find   │ companion /    │
│ 2×2 or 4 tiles │ discovery      │
│ actions        │ (hide empty)   │
│                │ bounded width  │
└────────────────┴────────────────┘
  tabs + Account chrome + SOS
```

---

## 19. CURRENT vs PROPOSED tokens

| Item | CURRENT | PROPOSED |
|---|---|---|
| Page canvas native Home | `fashionTech.canvas` via shared adaptive | Light `cloud`/`mist` **namespace later** |
| World cards | `VionaFashionWorldCard` dark-glass | Native universe tiles; **do not edit** shared file |
| Opening | AdaptiveComposition 188/220 hero | Short identity inside native opening |
| Typeface | Montserrat | Montserrat |
| Accents | Luminous Wave 3B | Same **meanings**, less glow |
| `fashionTech` values | Web + current native | **Do not mutate** |
| `vionaNativeClearPremium` | Absent | Future file; unused or parity until activation |

---

## 20. Status

Planning spec only. Not `LIGHT_MODE_CANONICAL`. Not `CLEAR_PREMIUM_ACTIVATED`. Not `VIONA_NATIVE_PRESENTATION_ISOLATED`.
