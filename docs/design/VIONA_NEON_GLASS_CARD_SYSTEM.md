# VIONA Neon Glass Card System

**Document type:** App-wide card doctrine  
**Audience:** Product, design, engineering, and AI agents implementing VIONA card surfaces  
**Status:** GLOBAL.CARDS.NEON — design doctrine (documentation only)  
**Relationship:** Implements the card layer of `VIONA_HUMAN_CONSTELLATION_DESIGN_SYSTEM.md` and aligns with Home fashion-tech reference surfaces. When visual polish conflicts with signed production truth, **operating protocol and blueprint win**.

---

## 1. Purpose

This doctrine defines VIONA’s **Neon Glass Card** language for **every major card surface** in the app.

The reference energy is the **Home screen**: dark cinematic base, vivid but controlled accent families, crisp luminous edges, soft outer glow, translucent glass, and hover that lets background art read through the surface. The product should feel **modern premium tech**—alive, high-trust, and global—not arcade gaming chaos.

Neon Glass is **not** “make every card equally loud.” Intensity is **tiered**. Color is **semantic**. Surfaces stay **one continuous glass plane** unless a screen explicitly needs a media thumbnail.

This document governs **visual language, hover behavior, accent assignment, and rollout discipline**. It does **not** authorize payment, auth, routing, wallet math, booking, AI runtime, or database changes by itself.

---

## 2. What Neon Glass is not

Reject patterns that break trust or read as entertainment UI:

| Anti-pattern | Why it fails |
|--------------|--------------|
| **Gaming / cyberpunk overload** | Rainbow rims, thick multi-color borders, pulsing everything, and loud text glow read as chaos—not a companion OS. |
| **Flat opaque slabs** | Cards that fully block the page background feel dead and disconnect the user from the cinematic field. |
| **Nested mini-cards** | Inner opaque panels, left color slabs, or “card inside card” layouts break the single-surface rule and cheapen the glass. |
| **One cyan wash everywhere** | Travel and AI accents must not collapse the whole app into a single blue tone. |
| **Magenta / red on routine services** | Emergency color is reserved for SOS, urgent safety, and explicitly labeled spotlight surfaces. |
| **Unreadable glow** | Accent light on typography must not sacrifice contrast or scan speed. |

**Controlled luminous edge** (thin crisp inset stroke, soft outer halo, accent-tinted wash) is in scope. **Thick neon frame overload** is out of scope.

---

## 3. Core principle: three intensity tiers

Assign **one tier per card**. Do not default every surface to Hero.

### Tier 1 — Hero / Primary

**Use for:** hero cards, main universe / destination cards, primary service entry cards, flagship bento tiles, and other “first read” surfaces.

**Behavior:**

- Strongest glow and soft outer shadow keyed to the accent family  
- Most vivid edge (still crisp, not chunky)  
- Larger internal corner wash and top highlight  
- Strongest hover reveal: lower fill alpha, higher backdrop participation, brighter edge and CTA/icon ink  
- Slightly more lift and scale on hover (web)

**Default posture:** cinematic and vivid, but text remains high-contrast white / soft body on dark glass.

### Tier 2 — Secondary

**Use for:** feature cards, helper cards, service grid cards, Local constellation cards, Home action grid cards, standard travel tiles, and most interactive service nodes.

**Behavior:**

- Moderate glow and family-tinted aura  
- Clear accent border and chip / icon halo  
- Visible hover reveal without overpowering the page  
- Balanced blur and translucency

**Default posture:** the workhorse tier—most app cards should land here unless they are hero or dense utility.

### Tier 3 — Utility / Dense

**Use for:** forms, wallet, pricing, checkout, settings, legal summaries, dense metadata lists, and any surface where **readability and calm** beat spectacle.

**Behavior:**

- Restrained glow and minimal sheen  
- Higher default fill alpha for legibility  
- Subtle hover only—no dramatic lift theater  
- Accent may appear on focus chips or status, not full-card neon wash

**Default posture:** on-brand but quiet; still glass-capable, not a return to flat gray admin panels.

---

## 4. Accent families (semantic color)

Each card carries **one primary accent family**. Secondary ink may support chips, icons, arrows, and status pills—not competing rim colors.

| Family | Meaning | Typical surfaces |
|--------|---------|------------------|
| **Emerald** | Local, community, trust, human support | Local hub, community services, trust-positive nodes |
| **Cyan** | Travel, movement, discovery, nearby, language / network | Travel hub, transit, interpreter, discovery |
| **Gold** | Premium, merchant, business, important CTA, VIP | Commerce anchor, merchant, high-intent CTA, premium listings |
| **Violet** | AI, academy, learning, pilot intelligence | Academy, AI practice, creative learning pilots |
| **Magenta / Red** | SOS, urgent, safety, emergency **only** | SOS rail, lifeline, urgent spotlight—not general service cards |

**Rules:**

- Do **not** use magenta / red for normal service, grid, or commerce cards.  
- Do **not** assign multiple families to one card frame.  
- Prefer **family-consistent** chips, icon rings, arrow ink, and hover aura—not border-only differentiation.

---

## 5. Card surface anatomy

A Neon Glass card is **one continuous premium surface**. Allowed layers are **translucent lighting**, not nested opaque blocks.

**Standard stack (conceptual, back to front):**

1. **Translucent fill** — dark navy glass; tier sets default and hover alpha  
2. **Glass tint** — neutral veil; lighter on hover to reveal background  
3. **Family aura / glow** — low-opacity accent wash across the face  
4. **Corner wash** — accent gradient from top-left; stronger on hover  
5. **Top hairline highlight** — accent-tinted 1px inner light  
6. **Optional hover sheen** — diagonal light sweep; tasteful, tier-scaled  
7. **Content** — typography, icon chip, status pill, footer CTA on the same plane  
8. **Crisp edge** — luminous inset stroke (web: inset box-shadow where used)

**Hard bans:**

- No nested mini-card slabs inside the frame  
- No opaque left color panels unless the screen **explicitly** needs a media thumbnail or licensed image lane (e.g. Home world photography with a narrow text scrim—not a generic inner panel)  
- No extra internal colored rectangles that read as a second card  
- No default full-width inner “panel” blocks for decoration

**Icon and chip treatment:**

- Icon sits in a **thin ring** or chip with accent border and controlled shadow glow—not a filled opaque tile slab  
- Status pills use accent-tinted fill and border; brighten on hover with the card  
- Arrow / chevron ink follows accent family; may gain glow on hover

---

## 6. Hover and background interaction

Hover must feel **premium and futuristic**, not playful or bouncy.

**On hover (web; press/focus may mirror where appropriate):**

- Card **lifts slightly** (tier-scaled translate + subtle scale)  
- **Border brightens** (stroke moves to hover ink)  
- **Accent glow intensifies** (aura, outer shadow, icon halo)  
- **Fill alpha decreases** so **background texture / photography / constellation field** reads through the glass  
- **Backdrop blur** participates on web where supported  
- **CTA / arrow / chip** ink becomes more luminous  
- Optional **sheen** sweep allowed at low opacity for Hero and Secondary only

**Background participation:**

- Page background art and cinematic fields should remain visible **through** card glass—not fully occluded by opaque blocks  
- Veils and scrims above photography are for **readability**, not for replacing the glass system with solid panels

**Typography:**

- Primary titles: bright white / strong ink  
- Body: slightly softer neutral on dark glass  
- Accent color on text **only where meaningful** (kicker, status, CTA)—do not glow body copy

---

## 7. Screen and component mapping (guidance)

Apply tiers and families consistently; exact file ownership lives in implementation packs.

| Area | Tier guidance | Family guidance |
|------|---------------|-----------------|
| **Home** | Hero for universe / world cards; Secondary for action grid | Local emerald, Travel cyan, Academy violet, Business gold, Care magenta only where SOS / care policy applies |
| **Local** | Secondary for service grid and commerce clarity; Hero only for intentional intro hero | Emerald primary; cyan discovery; gold merchant; violet AI pilot |
| **Travel** | Hero for map / flagship tiles; Secondary for flight and bento; Utility for dense meta / list rows | Cyan primary; gold for premium chauffeur / VIP moments |
| **Academy** | Hero for main learning entry; Secondary for lesson / feature cards | Violet primary |
| **Account / dense hubs** | Utility for list rows; Secondary for prominent actions | Match universe of the action, not one global cyan |
| **Wallet / pricing / checkout** | **Utility** unless a signed pack explicitly elevates a single marketing hero | Restrained gold for commerce emphasis only where policy allows |
| **SOS** | Serious, not gamified | Magenta / red lane only; no competing accents on the same lifeline control |

Shared implementation anchors (engineering reference, not a substitute for this doctrine):

- Tokens: `src/components/viona/neonGlassCardTokens.ts`  
- Frame: `src/components/viona/NeonGlassCardFrame.tsx`  
- Re-exports: `src/design/index.ts`  
- Local adapter: `src/components/local/LocalConstellationFrame.tsx` (Secondary tier + Local families)  
- Home world / action: `VionaFashionWorldCard`, `VionaActionCard`  
- Travel shell: `AcrylicPlatinumCard` (`appearance="neon"` where adopted)

---

## 8. Engineering and rollout constraints

Visual packs that apply Neon Glass must obey:

- **Preserve** existing behavior, handlers, routes, auth, payment, wallet, and booking logic unless a separate signed engineering change covers that scope  
- **No** backend / API / package.json / lockfile changes in visual-only packs  
- **Small, reviewable packs** with explicit file allow-lists  
- **No commit without user approval**  
- **Validation:** `npm run typecheck` and `npm run lint` for touched work  
- **Screenshot evidence** for representative routes (Home, Local, Travel, Academy, one dense utility surface, mobile where relevant)

Suggested pack id family: **GLOBAL.CARDS.NEON.*** (documentation, tokens, frame, then universe alignment).

---

## 9. Review checklist (per visual pack)

Before marking a Neon Glass pack complete:

1. Render path confirmed for target route(s).  
2. Each card has **one tier** and **one accent family** (unless documented SOS exception).  
3. **No** nested mini-card slabs or decorative inner opaque panels.  
4. **No** magenta / red on non-emergency service cards.  
5. Hover reveals background through glass on web for Hero / Secondary where interactive.  
6. Text contrast remains readable on default and hover.  
7. Wallet / checkout / dense forms remain **Utility** or explicitly exempted.  
8. `typecheck` and `lint` pass.  
9. Screenshots captured; **nothing staged** until user approves commit.

---

*End of VIONA Neon Glass Card System (GLOBAL.CARDS.NEON doctrine).*
