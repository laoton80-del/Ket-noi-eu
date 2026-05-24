# VIONA Semantic Color Mapping V1

**Pack:** `VIONA.WAVE_3B.SEMANTIC_MULTICOLOR_LUMINOUS_UI_LAW.1`  
**Status:** **LOCKED (design law)** — docs/tokens only; no screen migration in this pack  
**Date (UTC):** 2026-05-24  
**Companion:** `VIONA_LUMINOUS_DARK_PREMIUM_UI_LAW.md`, `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` §5  
**Classification:** Visual governance — **not** production launch, **not** commercial/Global Active, **not** native PASS

**Reference direction (design-time):** north-star overview (`viona_design_system_overview.png`), luminous AI/glass reference (`glassmophism.jpg`).

---

## A. Core rule

| Rule | Detail |
|------|--------|
| **Leading accent ≠ hard lock** | Each universe has a **leading accent** for atmosphere (hero wash, section kicker default). It does **not** force every tile to one color. |
| **Controlled semantic multicolor** | Feature tiles inside a hub **must** use `PremiumAppTile` `accent` when meaning differs from leading accent. |
| **Color carries meaning** | Accents encode **function semantics**, not decoration or brand rainbow. |
| **Text primary** | **Text status chip** (and title) carry meaning; **color is secondary**. Never icon-only status. |
| **No monochrome blanket** | Grids where every tile shares one accent without semantic reason are **forbidden**. |

**Code:** `premiumUniverseAccentByHub` = defaults only · `premiumUniverseAccentMap` = all feature materials · `accent` prop = per-tile override.

---

## B. Global semantic colors

| Accent | Meaning | Typical use |
|--------|---------|-------------|
| **Cyan** | Travel · tech · focus · navigation · assist | Transit, maps, settings, interpreter entry, ops overview |
| **Emerald** | Trust · local · success · health · safe status | Request-only, no-charge, confirmed≠paid, safety checklist |
| **Violet** | Academy · AI · language · insight · learning | Modules, LeTan preview, translation pilot, AI teacher beta |
| **Gold** | Premium · business · account · value · highlight | Identity chrome, VIP highlight, featured listing — **not** paid/payout |
| **Magenta** | SOS · alert · urgent · risk · special warning | Emergency hub, declined/warning — **not** dispatch/rescue |

**Assistant** (cyan + violet wash): LeTan / pilot assistant surfaces only.

---

## C. Safety constraints (mandatory)

| Accent | Must **not** imply |
|--------|-------------------|
| **Gold** | Payment captured, payout, cash-out, settlement, commercial readiness, subscription live |
| **Emerald** | Paid, settled, verified identity, KYC, completed transaction (unless explicitly true in copy) |
| **Magenta** | Dispatch, rescue guarantee, auto-alert, guaranteed response, autonomous emergency action |
| **Violet** | Autonomous AI action, accredited certification, production AI teacher |
| **Cyan** | Production automation, guaranteed booking, provider paid |
| **All** | Color **never** replaces explicit text — chips and subtitles state truth |

---

## D. Surface mapping tables

### HOME (leading accents on universe **entry** only)

| Feature / module | Semantic accent(s) | Notes |
|------------------|-------------------|--------|
| Local world card | **Emerald** | Leading for Local universe entry |
| Travel world card | **Cyan** | Leading for Travel entry |
| Academy world card | **Violet** | Leading for Academy entry |
| Business world card | **Gold** | Leading for Business entry |
| Account entry | **Gold / cyan** | Value + settings adjacency |
| SOS entry | **Magenta** | Urgent attention only |
| AI / Smart Trio | **Violet / cyan** | Pilot assist — not autonomous |
| Safety strip | **Emerald** | Trust / safe status |
| VIO Credits | **Gold** | In-app value — **no** cash-out/payment implication |

Interior hub grids still follow per-universe tables below.

---

### LOCAL (leading: **emerald**)

| Feature | Accent(s) | Notes |
|---------|-----------|--------|
| Request-only / no-charge | **Emerald** | Safety pills + chips |
| Confirmed ≠ paid | **Emerald** + text chip | Never gold “paid” |
| My requests | **Emerald / cyan** | Status + navigation |
| Browse services | **Emerald** | Lite / catalog |
| Booking assist | **Cyan** | Assist / focus |
| Nails & spa | **Emerald** or **gold** if featured | Gold = highlight only |
| Restaurant | **Emerald** | Local service |
| Transit | **Cyan** | Navigation |
| Legal & wealth | **Gold / cyan** | Premium info — no legal guarantee |
| Community events | **Violet / gold** | Social / highlight |
| Rentals & housing | **Cyan / emerald** | Stay + local trust |
| Classifieds normal | **Emerald** | Standard listing |
| Classifieds VIP / highlight | **Gold** | Featured — not paid booking |
| Lễ Tân AI preview | **Violet / cyan** | Pilot assistant |
| Translation / local-language assist | **Violet** | Language |
| Declined / warning | **Magenta** | Caution only |
| Connected Travel | **Cyan** | Universe bridge |
| Connected Business | **Gold** | Universe bridge |
| Connected Academy | **Violet** | Universe bridge |

---

### TRAVEL (leading: **cyan**)

| Feature | Accent(s) | Notes |
|---------|-----------|--------|
| Airport | **Cyan** | Navigation / transit hub |
| Rides / transit | **Cyan** | Movement |
| Public transport | **Cyan** | Schedules / routes |
| Hotel / stay | **Gold** | Premium stay highlight |
| Restaurant / food help | **Emerald** | Local-safe recommendations |
| Hospital / pharmacy | **Emerald** | Health adjacency |
| Translation assist | **Violet** | Language pilot |
| Emergency / police | **Magenta** | Urgent — guidance only |
| Travel safety | **Magenta / emerald** | Risk + safe checklist |
| Local fixer | **Emerald / cyan** | Local trust + assist |
| Cravings / discovery | **Violet / gold** | Explore / highlight |
| Vietnam guide | **Gold / violet** | Reference content |
| Embassy guidance | **Magenta / cyan** | **No** legal guarantee in copy |

---

### ACADEMY (leading: **violet**)

| Feature | Accent(s) | Notes |
|---------|-----------|--------|
| Cô Giáo AI | **Violet** | AI module |
| AI teacher beta | **Violet** + beta chip | Not production certification |
| Basic Vietnamese | **Cyan / violet** | Learning + interactive |
| Survival phrases | **Cyan** | Practice |
| Vietnamese culture | **Violet / gold** | Content + highlight |
| Family learning | **Emerald / violet** | Progress + learning |
| Practice & quiz | **Cyan / violet** | Interactive |
| Progress / completion | **Emerald** | Success state |
| Achievement / highlight | **Gold** | Highlight only |
| Not certification | **Emerald / gold** chip | Honest status |
| High-stakes warning | **Magenta** | Caution |

---

### BUSINESS / MERCHANT (leading: **gold**)

| Feature | Accent(s) | Notes |
|---------|-----------|--------|
| Merchant inbox | **Gold / cyan** | Workflow + ops |
| Local service request inbox | **Emerald / cyan** | Request-only adjacency |
| Ops overview | **Cyan** | Operational view |
| Catalog / services | **Gold** | Merchant catalog |
| AI receptionist preview | **Violet / cyan** | Pilot — not autonomous |
| Request-only workflow | **Emerald** | No charge captured |
| Pilot / locked / gated | **Gold / violet** | State honesty |
| Risk / missing approval | **Magenta** | Warning |
| QR / VietQR preview | **Cyan / gold** | **No** settlement claim |
| Revenue preview | **Gold** | Demo/reference if not commercial |
| Pending requests | **Cyan / gold** | Queue status |

---

### ACCOUNT (leading: **gold / cyan**)

| Feature | Accent(s) | Notes |
|---------|-----------|--------|
| Profile / identity | **Gold** | Account chrome |
| Self-declared profile | **Gold** + honest chip | Not KYC |
| Security / settings | **Cyan** | Tech / focus |
| Privacy | **Cyan / violet** | Policy + insight |
| VIO Credits in-app | **Gold** | **No** cash-out |
| Membership / premium-looking | **Gold** | **No** subscription claim unless ready |
| Safe status | **Emerald** | **Not** verified identity |
| Warnings | **Magenta** | Risk |
| Assistant / profile intelligence | **Violet** | Pilot AI |
| Language / preferences | **Violet / cyan** | Settings |

---

### SOS (leading: **magenta**)

| Feature | Accent(s) | Notes |
|---------|-----------|--------|
| SOS hero / urgent entry | **Magenta** | Atmosphere |
| Emergency categories | **Magenta** | Urgent taxonomy |
| Call local emergency number | **Magenta / cyan** | Action — user dials |
| Safety checklist | **Emerald** | Safe guidance |
| Trusted contact | **Emerald / cyan** | Trust + comms |
| Location / map / route | **Cyan** | Navigation |
| Language emergency assist | **Violet** | Translation pilot |
| Embassy / police / medical guidance | **Magenta / cyan** | **No** dispatch claim |
| Scam / risk alert | **Magenta** | Warning |
| After-action notes | **Cyan / violet** | Follow-up |
| Safe status | **Emerald** | Reassurance — not rescue guarantee |

---

## E. Implementation checklist (pack authors)

1. Set hub **leading** on shell/hero (`PremiumAppShell` `leadingAccent`, section kickers).  
2. Map each tile using this doc → `PremiumAppTile` `accent`.  
3. Keep chip **text** explicit for money/SOS/AI honesty.  
4. Use `premiumLuminousInk` for titles/subtitles on dark glass.  
5. Screenshot QA at 390 / 768 / 1024 / 1366 after migration.

---

## F. Related documents

| Doc | Role |
|-----|------|
| `VIONA_LUMINOUS_DARK_PREMIUM_UI_LAW.md` | Typography, glass, glow, mobile, old-UI ban |
| `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Tile anatomy + §5 glow law |
| `VIONA_WAVE_3B_PREMIUM_APP_SHELL_FOUNDATION.md` | Shell/layout migration sequence |
| `src/design/premiumTileVisualTokens.ts` | Token source of truth |

**Not claimed:** production readiness, commercial readiness, Global Active, native PASS.
