# VIONA Glass Light Polish System

**Premium Glass · Intent-led Glow · Trust-first Depth**

---

## 1. Purpose

This document is the **official app-wide visual polish doctrine** for the **VIONA super app**. It defines how future UI packs should enhance surfaces using **glass, controlled light, depth, and trust-first presentation**—without replacing VIONA’s existing color system or semantic intent.

- **Enhance** the product: readability, hierarchy, tactile quality, field confidence, and premium trust.
- **Preserve** palette intent: midnight / deep navy bases, champagne gold, cyan/teal, violet/magenta accents, ivory text—unless a separate **brand** initiative explicitly changes it.
- **Glass = polish**, not a repaint. Polish layers sit **on top of** meaning already encoded in color and layout.

Implementation packs must **name themselves**, **list allowlisted files**, and **reference this doctrine** in PR descriptions.

---

## 2. Core visual principle

| Rule | Detail |
|------|--------|
| **Preserve color intent** | Cards, rails, and screens keep **meaningful** accent families. Polish adjusts **opacity, internal light, edge refraction, depth, and glass recipe**—not arbitrary recoloring. |
| **No page-by-page dominant color** | Do not make each route a new “theme color.” Universe and **intent** drive accent; polish is a **shared material language**. |
| **Polish dimensions** | **Glass surfaces**, **soft material light inside glass**, **thin luminous borders**, **ambient field restraint**, and **depth** (shadow, separation from canvas). |
| **Color = meaning** | Hue and accent communicate role; polish must **not** dilute that map. |
| **Glass = polish** | Translucency, tint, sheen, and edge refraction support legibility and premium feel. |
| **Glow = emphasis** | Glow **intensifies what already matters**—it does not invent new meaning. |
| **Page mood = subtle only** | Canvas shifts and veils stay **low amplitude**—cinematic, not a generic “bright mode” per screen. |

---

## 3. Semantic glow hierarchy

Glow and outer luminance **must** map to intent. When in doubt, prefer **neutral depth** + **thin gold or cyan hairline** before adding chroma.

| Family | Use for |
|--------|---------|
| **Gold glow** | Premium, brand, primary **CTA**, **VIO Credits**, upgrade, paid value, VIP, merchant revenue highlights. |
| **Cyan glow** | Tech, **AI**, interactive focus, global tools, **language / translation**, discovery, connection. |
| **Emerald / teal glow** | Verified, trust, success, safe state, completed, ready, local “grounded” success. |
| **Magenta / rose / red glow** | **SOS**, emergency, critical warning, destructive or irreversible actions—**sparingly**. |

**Cross-rule:** SOS and emergency paths **own** the serious red/magenta band; do not decorate non-critical UI with SOS-level chroma.

---

## 4. Global glass tokens (directional)

Exact values live in token modules per pack; this table defines **what** must exist and **how** it behaves.

| Token area | Role |
|------------|------|
| **Glass surface** | Default card/panel: dark translucent fill, **low** neutral tint; blur (when used) on a **background slab** below text where possible—see implementation discipline. |
| **Elevated glass** | Slightly higher lift/contrast for stacked panels or modals. |
| **Hero glass** | Large living frames: more air, controlled veil; still **not** flat white. |
| **Command bar glass** | Fixed rail: harmonize with canvas; **thin** gold/cyan edge language. |
| **Thin luminous border** | ~**1px** (or web inset `box-shadow` equivalent)—**never** thick neon tubes. |
| **Inner highlight** | Suggests **volume inside** the glass (soft strip or radial, low opacity). |
| **Top-edge sheen** | Specular hint (ivory / cool), **material** not billboard. |
| **Edge refraction** | Slight chroma or brightness shift **at the rim** keyed to **semantic accent**—not a rainbow perimeter. |
| **Surface reflection** | Very soft oblique or top-weighted reflection **inside** the card footprint. |
| **Soft ambient glow** | **Contained**: inside the component or **tight** to the rim—see **Daylight Glass Material Rule**. |
| **Background orb / haze** | Section-level depth only when product spec demands; must not read as **washed** white haze over copy. |
| **Shadow / depth** | Separation from canvas; avoid muddy mega-shadows on dense grids. |
| **Hover / focus / active** | Short transitions (~170–220ms), ease-out, **no layout shift**; visible focus for keyboard/a11y. |
| **Accessibility** | If blur or lift hurts contrast, **reduce blur** or **raise fill**—never ship illegible glass for effect. |

---

## 5. Daylight Glass Material Rule

**Daylight** (including **Daylight Boost** on Home) must **not** read as “a backlight turned on behind the cards” or a crude **halo behind** every tile. Premium Daylight must make each surface feel like **luminous glass material**: light **inside** the glass, refraction at the edge, and accent-aware glow **tied to the card’s existing semantic color**—not a one-size-fits-all cyan wash.

### Allowed

- **Inner glass illumination** (soft lift **inside** the surface, not behind the whole row).
- **Subtle card surface lift** (translucency / tint shift that suggests material, not a floodlight).
- **Top-edge sheen** and **inner highlight** (specular discipline, low opacity).
- **Edge refraction** (thin, crisp; can echo **existing** card accent).
- **Soft tint** derived from the **card’s semantic accent** (gold / cyan / emerald / violet / magenta families)—controlled opacity.
- **Improved text contrast** (shadow, ink, fill balance—readable in sunlight without white haze over type).
- **Controlled highlight** near **CTA** or **active** state only where product approves.
- **Localized glow** **contained** inside the component or **immediately** adjacent to the rim—not a large blob bleeding across the canvas.

### Not allowed

- **Large backlight blobs** behind every card or across the lower half of the screen as the primary story.
- **Washed-out background** or **bright white haze** over text.
- **Thick outer neon border** or **rainbow** perimeter.
- **One-size-fits-all cyan glow** on every card regardless of meaning.
- **Equal brightness on every card**—hierarchy requires some surfaces to stay quieter.
- **Low-premium “LED strip behind card”** aesthetic (posterior halo without material interior).

**Product line:** Daylight is **outdoor readability through material quality**, not “more light behind everything.”

---

## 6. Universe application rules

### Home / Hub

- Balance **gold / cyan / emerald / magenta** by **card meaning**; command-center clarity.
- **Daylight** on Home must follow **§5 Daylight Glass Material Rule** when revisited (see **Rollout — Phase 9**).

### Local

- Commerce + trust: **emerald** for verified/success, **gold** for premium/paid/boost, **cyan** for AI/language tools.

### Travel

- Navy premium glass base; **cyan** for tools/translation/navigation; **gold** for VIP/premium; **emerald** for readiness; **red/magenta** only for warnings / SOS-linked criticality.

### Academy

- Calm learning glass; **violet** soft for learning/demo identity—not SOS-danger styling; **cyan** for interactive/AI practice; **emerald** for progress/complete.

### Business / Merchant

- Dark ops glass; **cyan** for automation/AI signals; **gold** for revenue/plan/premium; **emerald** for ready/verified; **red/magenta** for risk/issue only.

### Account / Identity

- Premium control center; **gold** for VIO/subscription; **emerald** for verified/complete; **cyan** for security/tools; minimal simultaneous glows.

### SOS

- Serious **red/magenta** safety glass; calm, accessible typography; **no nightclub** effects.
- **Copy:** VIONA SOS **does not replace** local emergency services; no fake GPS, calls, recording, live response, or guaranteed rescue claims.
- **No fake capability** implied by polish.

---

## 7. Forbidden patterns

| Forbidden | Why |
|-----------|-----|
| Rainbow or **per-side different** border colors | Gaming look; breaks semantic map. |
| **Thick neon outlines** | Cheap cyberpunk; kills trust. |
| **Gaming / hacker / security-dashboard** aesthetic | Conflicts with finance and safety trust. |
| **Crude halo behind cards** as primary Daylight story | Violates **§5**; reads as LED strip, not glass. |
| **Over-blurred text** | Fails readability. |
| **Low-contrast text on glass** | Fails field and a11y goals. |
| **Glass everywhere without hierarchy** | Noise and performance cost. |
| **Fake metrics, status, payments, emergency** | CFO, legal, and safety violations. |

---

## 8. Component guidance (future; gradual)

Shared primitives **may** include names such as: `VionaGlassCard`, `VionaGlassPanel`, `VionaGlassHero`, `VionaGlassCommandBar`, `VionaGlowButton`, `VionaGlowChip`, `VionaGlassModal`, `VionaGlassInputShell`.

**Do not** build all primitives at once. Introduce through **scoped packs** with explicit file allowlists; reuse existing frames (`NeonGlassCardFrame`, constellation/local frames, account glass, fashion shell) where they already match this doctrine.

---

## 9. Rollout plan

| Phase | Focus |
|-------|--------|
| **Phase 1 — Doctrine / docs** | This document + cross-links from existing design docs; no app code in Phase 1 packs that are docs-only. |
| **Phase 2 — Account / Login / SetupProfile glass identity pack** | Identity console and auth entry surfaces; readable glass, restrained glow. |
| **Phase 3 — Local glass commerce pack** | Local hub cards and commerce trust; emerald/gold/cyan per §6. |
| **Phase 4 — Travel glass companion pack** | Travel hub and companion surfaces; navy + cyan/gold/emerald discipline. |
| **Phase 5 — Business / Merchant glass ops pack** | Merchant ops density; clarity over spectacle. |
| **Phase 6 — SOS safety glass pack** | Safety-specific polish + copy audit; **§5 “not allowed”** especially strict. |
| **Phase 7 — MainTabNavigator review pack** | Navigation shell review **only** in a dedicated pack—routing behavior unchanged unless explicitly approved. |
| **Phase 8 — B2BPaywall CFO review pack** | Paywall **visual and copy** under monetization guardrails; **no** pricing logic changes unless a separate eng task. |
| **Phase 9 — Revisit Home Daylight** | **Premium glass material**, not backlight: implement **§5** on Home Daylight Boost / related surfaces after Phases 2–8 inform the language. |

Phases may proceed in parallel **only** when packs touch **disjoint file allowlists** and have **separate** review/merge.

---

## 10. Implementation discipline (every UI polish pack)

1. **Name scope clearly** (e.g. `VIONA.GLASS.LIGHT.POLISH.LOCAL.1`).
2. **List files to touch** (allowlist); no drive-by edits.
3. **Avoid broad refactor**; smallest diff that satisfies the doctrine.
4. **Preserve behavior** and **routes** unless a dedicated navigation/behavior pack says otherwise.
5. **Preserve i18n keys** unless the pack explicitly includes Smart Trio copy work.
6. **Do not touch** backend, payment, auth secrets, DB, Prisma, booking, wallet, Twilio, AI runtime, or tenant logic in a polish-only pack.
7. Run **`npm run typecheck`** and **`npm run lint`**; report results.
8. Attach **screenshots or checklist** for visible UI changes.
9. **Do not commit** unless the user explicitly approves.

---

## 11. Review checklist

- [ ] **Brand colors preserved** (no unauthorized palette shift).
- [ ] **Semantic glow respected** (gold / cyan / emerald / red per intent).
- [ ] **Glass reads as material** (inner light, sheen, refraction—not only posterior halo).
- [ ] **Daylight** (when in scope) obeys **§5 Daylight Glass Material Rule**.
- [ ] **Text readable**; no white haze over copy; contrast acceptable outdoors where specified.
- [ ] **CTA clear**; glow supports, not obscures, primary action.
- [ ] **SOS serious**; honest copy; no playful danger chrome.
- [ ] **No fake production / payment / emergency state.**
- [ ] **Scope small** (allowlist honored).
- [ ] **Typecheck / lint** reported.

---

## Document control

| Field | Value |
|-------|--------|
| **System name** | VIONA Glass Light Polish System |
| **Type** | Design doctrine (baseline for UI packs) |
| **Conflicts** | If an older pack contradicts this file, **escalate to product**; default to **stricter** trust and material rules. |
