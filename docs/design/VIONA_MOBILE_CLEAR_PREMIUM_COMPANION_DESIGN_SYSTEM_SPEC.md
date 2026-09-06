# VIONA Mobile — Clear Premium Companion Design System Spec

**Document type:** Planning-level design system specification (docs only).
**Governs:** Proposed future **native iOS/Android** consumer presentation.
**Does not govern:** Current web Fashion-Tech / luminous-dark product UI (preserved).
**Does not authorize:** Runtime, asset, token-file, or design-lock mutation.

**Parent plan:** `docs/product/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_AND_HOME_ARCHITECTURE_MASTER_PLAN.md`

**Authorizations:** branch + content phrases recorded in the evidence README.

```text
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_NATIVE_PRESENTATION_ISOLATION_REQUIRED_BEFORE_CLEAR_PREMIUM_RUNTIME_ACTIVATION
```

Canonical typeface **fact:** **Montserrat** via `src/theme/typography.ts`.

This spec distinguishes **CURRENT TOKEN** (in repository source today) from **PROPOSED TOKEN** (planning-only; not runtime-bound).

Do not treat proposed hex values as canonical runtime until a later Phase 0 pack maps them into a **native-isolated** token layer.

---

## 1. Dark-lock coexistence and native carve boundary

**CURRENT (docs lock, unchanged):** `docs/design/VIONA_DESIGN_MODE_LOCK.md` — dark is primary product UI; light is presentation-only.

**PROPOSED (this packet):** a **native-only** Clear Premium Companion surface that is light-first.

| Surface | Until separately authorized |
|---|---|
| Web desktop / mobile-web / tablet-web | Keep `fashionTech` + Wave 3B luminous dark-glass |
| Native | Remain on shared adaptive Home (current) |
| Native after isolation pack | May map **PROPOSED** light surfaces **without** editing web primitives |

Isolation options for a later pack (not chosen here): platform branch, dedicated native composition file, or shell-mode token that does not restyle web adaptive path.

Do **not** restyle `VionaFashionHomeAdaptiveComposition` / `VionaFashionWorldCard` / `premiumTileVisualTokens` in place.

---

## 2. Surface hierarchy

### CURRENT TOKEN (examples)

From `vionaTokens.fashionTech`: `canvas` `#07090e`, `surfaceGlass`, champagne/gold edges, SOS neon.

From `vionaTokens.colors` (already present light subset): `cloud` `#F3F8FF`, `mist` `#EAF1FB`, `white` `#FFFFFF`, `ink` `#0B1628`, `surface` `rgba(255,255,255,0.95)`.

### PROPOSED TOKEN (native carve only)

| Token | Role | Planning value (not runtime) |
|---|---|---|
| `bg.canvas` | Page background | Prefer mapping from current `cloud`/`mist` family, not a new invented system |
| `bg.surface` | Cards | Current `white` / `elevatedSurface` |
| `bg.elevated` | Sheets | Current `elevatedSurface` |
| `bg.interactive` | Pressed | Derive from `mist` |
| `bg.selected` | Selected chip | Derive from travel/local light `universe.*.bg` already in `vionaTokens.colors.universe` |
| `bg.critical` | SOS surfaces | Current `colors.safety.bg` `#FFE4E6` |
| `ink.primary` | Text | Current `ink` / `softInk` |
| `line.subtle` | Borders | Current `colors.border` |

Glass: **restrained** on the proposed native carve. Prefer solid light surfaces. Web may keep dark glass.

---

## 3. Semantic colors

### CURRENT TOKEN

Wave 3B / `premiumTileVisualTokens`: cyan, emerald, violet, gold, magenta-for-SOS; glow on dark glass.

`vionaTokens.colors.universe`: local teal, travel blue, academy violet.

### PROPOSED TOKEN (native)

Same **meanings**; less glow. One **leading accent per screen**.

| Universe | Leading family | Current repo anchor |
|---|---|---|
| Travel | cyan / sky / blue | `universe.travel.accent` / `fashionTech.accentCyan` |
| Local | emerald / teal | `universe.local.accent` / `accentEmerald` |
| Academy | violet / indigo | `universe.academy.accent` / `accentViolet` |
| Business | navy / gold | `fashionTech.champagne` + navy ink |
| Account | neutral / gold | champagne/gold **value only** |
| SOS | red critical only | `colors.safetyRed` / `safety.accent` — **not** sale pink |

Reservations: red ≠ discounts; green ≠ fake paid; gold ≠ cash-out; cyan ≠ AI executed; violet ≠ certified teacher.

---

## 4. Typography

**CURRENT TOKEN:** Montserrat `FontFamily.regular|medium|semibold|bold|extrabold`.

**PROPOSED roles** (sizes are planning; map to existing `vionaTokens.typography` where possible):

| Role | Current `vionaTokens.typography` | Proposed use |
|---|---|---|
| Display | `display` 34/800 | Rare Home greeting |
| Page title | `h1`/`h2` | Screen name |
| Section title | `title` 17/700 | Section headers |
| Card title | `title` / `bodyStrong` | 1–2 lines |
| Body | `body` 14 | Prefer ≥15 on native if later mapped |
| Secondary / meta / caption | `meta` / `caption` | Metadata, badges |
| Button | — | semibold, min 44 height |
| Numeric | — | Only when values are real |

Do not replace Montserrat in this packet.

---

## 5. Spacing and 8pt grid

**CURRENT TOKEN:** `vionaTokens.spacing` includes 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64.

**PROPOSED native scale:** prefer 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 (8pt-aligned). Use 2/6 only for optical hairlines.

Page padding (phone): current `layout.pagePaddingMobile` = 16.

---

## 6. Touch targets

**CURRENT TOKEN:** SOS min touch 44; `premiumShellChrome` tab clearance exists.

**PROPOSED:** 44–48px minimum on all primary controls, including Account chrome and universe tiles.

---

## 7. Radius

**CURRENT TOKEN:** `vionaTokens.radius` sm 8, md 12, lg 16, xl 20, xxl 26, pill 999.

**PROPOSED native cards:** 16–20 (use current `lg`/`xl`). Buttons: current `md`. Chips: `pill`. Safety cards: `lg` (not playful).

---

## 8. Borders

**CURRENT:** fashionTech gold/`borderSubtle` on dark; light `colors.border`.

**PROPOSED native:** soft neutral from current `colors.border`. No neon gold edges as native default (web may keep them).

---

## 9. Shadows

**CURRENT TOKEN:** `vionaTokens.shadows.none|soft|medium|hero` plus fashionTech `shadowPanel`.

**PROPOSED native:** `soft` / `medium` only. Do not use `hero` or fashionTech panel shadow as native default.

---

## 10. Iconography

**CURRENT:** Ionicons outline/filled in tabs and Home.

**PROPOSED:** keep Ionicons; 20–24 in tiles; 22 in tabs; icon + label except SOS (accessible name required). Do not clone third-party OTA sets.

---

## 11. Imagery

**CURRENT:** Fashion Home world-card photography and Wave 3B assets on shared composition.

**PROPOSED native:** image-first Travel/Local **when licensed VIONA assets**; always a11y labels; never imply live inventory via stock. SOS activation: no lifestyle promo photo.

Isolation required before swapping crops on shared `VionaFashionWorldCard`.

---

## 12. Card taxonomy

Do not invent a component per screen. Ten classes:

1. App / universe tile — launcher; readiness **text** chip; whole-tile press
2. Quick-action tile — icon + short label; no discount badges; 48px min
3. Service card — Local; image/title/category; rating/distance/price **only if real**
4. Commerce/product card — Travel/catalog when real; no fake strike-through
5. Recommendation card — discovery; empty-state required
6. Status card — request/order/trip; text status primary, color secondary
7. Account utility card — icon/title/chevron; no promo art
8. Learning-progress card — Academy; no fake certificates
9. Business metric/action card — dense SaaS; em-dash if unknown
10. Safety card — SOS categories; no commerce chrome; red only if critical

---

## 13. Buttons

Primary (one per section) · secondary outline · tertiary text · destructive confirm · **safety hold** (SOS 3000ms — not a commerce primary).

Min height 44–48. No ALL-CAPS walls.

---

## 14. Chips / badges

Readiness: Lite Demo Pilot Beta Coming Soon Gated Frozen.
Filter · status · semantic alert (safety).
Never red “-50%”. Never green “Paid” without ledger truth.

---

## 15. List rows

44–56px. Leading icon · title · subtitle · trailing chevron/value.

---

## 16. Navigation (spec)

**CURRENT FACT:** four B2C tabs Home / Local / Travel / Academy; Account chrome → PersonalHub.

**PROPOSED:** visual restyle of **current** tabs only after isolation. Five-tab Option B is a **separate nav pack**, not this spec’s runtime.

Labels one word. SOS exact-one host. Safe-area padding accounts for SOS chip.

---

## 17. Headers

Contextual greeting; do not duplicate interactive Account/Language if chrome already owns the exact-one host on that surface.

---

## 18. Sheets / modals

Language, filters, AI assistant, canonical SOS modal. Dim overlay. Tap-outside dismiss **except** SOS hold-in-progress. Grabber + title + close.

---

## 19. Forms

Labels above fields; helper in meta role; errors in red **with text**.

---

## 20. Search

Primary Home field: find/search/ask. AI chip secondary. No fake results. Depth of current Home search: **NEEDS_CONFIRMATION**.

---

## 21. Empty / loading / error / success

Empty: title + sentence + optional CTA; no fake lists.
Loading: skeleton; never block SOS; respect reduced motion.
Error: inline + retry; no fake “booking failed” if no booking rail.
Success: only after real mutation.

---

## 22. AI states

Entry chip · minimized (does not cover SOS) · expanded sheet with persona + Beta · loading/cost guard · unavailable (universes still work) · tool confirm.

No runtime AI in this packet.

---

## 23. SOS states

Idle (accessible “SOS”) · holding 0–1 over **3000ms** · cancelled reset · open canonical modal · Plus/Gated honest labels · live automation **not claimed**.

Copy: VIONA SOS does not replace local emergency services.

---

## 24. Motion and reduced motion

**CURRENT:** `useFashionHomePrefersReducedMotion` exists on Home.

**PROPOSED:** navigation ≤220ms; card press 80–120ms scale ~0.98; sheet ~240ms; safety hold **linear** (no bounce). Interruptible.

---

## 25. Accessibility

Touch 44–48; contrast ≥4.5:1 on proposed light surfaces; labels on icon buttons; status not color-only; dynamic type without truncating SOS; one-handed SOS in lower half on phone; universe tiles announce readiness chips.

---

## 26. Phone / tablet

| | Phone portrait | Phone landscape | Tablet portrait | Tablet landscape |
|---|---|---|---|---|
| Universe tiles | 2×2 | 4-across compact | 4-across | left column or 4-across |
| Quick actions | 2×2 or scroll | 1 row | 1 row of 6 | 1 row |
| Hero | optional/short | collapsed | moderate | companion column |
| Nav | **four-tab current fact** | same | same | same; never desktop rail |
| SOS | exact-one chrome/rail | same | same | same |

---

## 27. Web isolation (spec law)

If a shared RN component is restyled, web must keep `fashionTech` / Wave 3B via platform or shell-mode branch.

```text
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED
```

Do not copy Mytour colors, banners, badge density, or composition. Do not treat proposed light-first values as `LIGHT_MODE_CANONICAL`.
