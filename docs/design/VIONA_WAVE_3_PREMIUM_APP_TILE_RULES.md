# VIONA Wave 3 — Premium App Tile Rules

**Pack:** `VIONA.WAVE_3.PREMIUM_APP_TILE_RULES.1`
**Prep:** `docs/design/VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md`
**Surface audit:** `docs/design/VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md`
**Master wave roadmap:** `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md`
**Rules baseline HEAD:** `f444a6b` — `docs(design): audit Wave 3 consumer UX surfaces`
**Rules date (UTC):** 2026-05-24
**Status:** **RULES COMPLETE** — shared consumer tile grammar locked for Wave 3 implementation packs

**Classification:** Docs/static design law — **not** production launch, **not** commercial/payment readiness, **not** Global Active / full commercial, **not** native production confidence. **Not** a component extraction or UI implementation pack.

---

## 1. Purpose

Define the **shared consumer tile grammar** for VIONA so every consumer universe feels:

| Quality | Meaning |
|---------|---------|
| **Premium** | Glass/constellation material, restrained glow, confident typography |
| **Clear** | Short title + subtitle; status in words, not color alone |
| **Daily-use friendly** | Scannable grids; obvious next action |
| **Multilingual-friendly** | VI/EN compressible; keys over hardcoded strings |
| **Easy to scan** | Consistent anatomy across hubs |
| **Trust-first** | Safety visible where money or SOS is adjacent |
| **Home-aligned** | Home world cards are the **design standard**; hubs harmonize, not reinvent |

Implementation packs **must** reference this document before changing consumer surfaces.

---

## 2. Sources of truth (extracted patterns)

| Source | Path | Role in grammar |
|--------|------|-----------------|
| **Home world card** | `src/components/viona/VionaFashionWorldCard.tsx` | Hero / universe entry; image-backed; accent rail + status pill; min heights 168–172px |
| **Home shell** | `src/screens/HomeScreen.tsx`, `fashionHomeDesktopShell.ts`, `VionaFashionHomeCommandBar.tsx` | Command rail, hybrid hero + world grid, semantic accents per universe |
| **Local compact tile** | `src/components/local/LocalAppTile.tsx` | **Canonical compact app tile** — icon chip 44×44, status pill, title 13px extrabold, subtitle 10px, min press 44px, tile inner ~120px |
| **Local frame** | `src/components/local/LocalConstellationFrame.tsx`, `localConstellationTokens.ts` | Emerald/cyan/gold/violet accents; glass edge + contained glow |
| **Local clarity** | `src/components/localCommerce/LocalCommerceClarityBlock.tsx` | Status/safety **hero-tier** block (not a module tile) |
| **Travel compact tile** | `src/components/travel/TravelAppTile.tsx` | Same title/subtitle scale as Local; `quickHelp` variant = larger hero-adjacent tile (~112px) |
| **Travel glass** | `src/components/travel/TravelGlassCard.tsx` | Semantic accents incl. magenta for emergency scenarios |
| **Academy module card** | `src/components/academy/AcademyGlassCard.tsx` | Module tile with title + **status** + body (up to 4 lines) — **upper bound** for copy density |
| **Surface audit** | `docs/design/VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md` | Per-surface alignment, gaps, pack order |
| **Experience manifesto** | `docs/design/VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md` | North-star principles |

**Implementation note:** Rules describe **product law**. Code may diverge until packs land; new work **converges** toward these rules, not away.

---

## 3. Core tile anatomy (required)

Every **Premium App Tile** (compact or hero) **must** include:

| Element | Rule |
|---------|------|
| **Icon or symbolic visual** | Ionicons capsule or world-card art; min 40–44px touch area for icon chip |
| **Short title** | 1 line preferred (`numberOfLines={1}`); max 2 only on hero/world cards |
| **Concise subtitle** | 1–2 lines max; 10–11px equivalent; no paragraph body on compact tiles |
| **Optional badge / status chip** | Uppercase micro-label (`requestOnly`, `pilot`, `lite`, etc.); **text required** |
| **Semantic glow / accent** | Stroke, rim, or contained shadow tied to meaning (see §6) |
| **Clear press target** | `accessibilityRole="button"`; min height **44px** on pressable wrapper |
| **Spacing** | Inner padding ~12–14px; gap 8–10px between icon row and text block |
| **No dense paragraphs** | Body copy >2 lines belongs in detail screens, not compact tiles |
| **No hidden critical safety copy** | No-charge / confirmed≠paid / SOS pilot must not be tooltip-only |
| **No icon-only ambiguity** | `accessibilityLabel` = title + subtitle when needed; never icon-only consumer tiles |

**Reference measurements (from `LocalAppTile` / `TravelAppTile`):**

- Title: 13px extrabold, ~17px line height  
- Subtitle: 10px medium, ~14px line height, ≤2 lines  
- Status pill: 8px extrabold uppercase  
- Compact tile inner min height: **~108–120px**  
- Icon chip: **44×44** (Local), **40×40** (Academy capsule)

---

## 4. Tile hierarchy

### 4.1 Hero quick-action / universe entry tile

| Attribute | Rule |
|-----------|------|
| **Use** | Primary universe CTA (Home → Local/Travel/Academy/Business); Travel `quickHelp`; Local hero `LocalConstellationFrame` intro |
| **Visual** | Larger min height; may use background image (`VionaFashionWorldCard`) or hero frame tier |
| **Copy** | Short eyebrow optional; title + subtitle; status pill (`pilot`, `lite`, `safe`) |
| **Glow** | Stronger rim allowed; animated neon rim **only** on Home world cards (sparingly) |
| **Reference** | `VionaFashionWorldCard` (`variant`: `heroRow` \| `grid`); Travel `variant="quickHelp"` |

### 4.2 Compact app tile (default module grammar)

| Attribute | Rule |
|-----------|------|
| **Use** | Scenario/module grids (Local bento, Travel scenarios, Academy modules) |
| **Visual** | Grid-friendly width; consistent min heights within a row |
| **Copy** | Title + subtitle + optional `statusLabel` |
| **Glow** | Contained semantic glow on stroke/chip — not full-card wash |
| **Reference** | `LocalAppTile`, `TravelAppTile` (`standard`), `AcademyGlassCard` (module) |

### 4.3 Status / safety tile (non-navigation emphasis)

| Attribute | Rule |
|-----------|------|
| **Use** | No-charge legend, booking status chips, SOS disclaimers, pilot badges |
| **Visual** | May span width; emerald for safe/request-only; magenta for SOS attention |
| **Copy** | Safety state in **plain language**; not buried in subtitle of unrelated module |
| **Reference** | `LocalCommerceClarityBlock`; SOS `EmergencyHubTile` + disclaimer panel |
| **Rule** | **Not** a substitute for compact tiles — sits **above** or **beside** grids |

### 4.4 Admin / ops dashboard panels (out of scope)

| Attribute | Rule |
|-----------|------|
| **Use** | `MerchantDashboardScreen`, B2B inbox rows, ops lists |
| **Rule** | **Do not** force merchant/ops dashboards into Premium App Tile grammar |
| **Consumer entry** | Home **business world card** only — polish route copy, not dashboard interior |

### 4.5 Non-tile surfaces (explicit exceptions)

| Surface | Grammar |
|---------|---------|
| **LeTan / assistant** | Conversation UI — entry may use compact tile; interior is chat, not tiles |
| **Account `VionaActionGrid`** | Action cells — align **accent semantics** with this doc; full tile anatomy optional in Account pack |
| **Home briefing rail** | Horizontal info cards — **deprecated pattern** for new modules; do not extend |

---

## 5. Semantic glow law — leading accent + controlled multi-color

**Wave 3B correction (`VIONA.WAVE_3B.SEMANTIC_COLOR_GOVERNANCE.1`):** VIONA does **not** use one fixed color per universe. Each hub has a **leading universe accent** (atmosphere / section identity). Feature tiles inside that hub use a **semantic feature accent** chosen per tile (`PremiumAppTile` `accent` prop). **Controlled multi-color** premium grids are **recommended** and match the north-star reference.

| Concept | Code / doc | Rule |
|---------|------------|------|
| **Leading universe accent** | `premiumUniverseAccentByHub` / `variant` default | Hub hero, canvas wash, default tile when `accent` omitted |
| **Semantic feature accent** | `accent` prop on `PremiumAppTile` | Per-tile meaning inside the hub — **overrides** leading accent |
| **Controlled multi-accent** | Mixed accents in one `PremiumTileGrid` | Allowed and encouraged when semantics differ |

### 5.1 Semantic feature accent meanings

| Accent | Meaning | Typical feature use |
|--------|---------|---------------------|
| **Cyan** | Travel · tech · navigation · interactive · focus | Transit, maps, booking assist, settings, interpreter entry |
| **Emerald** | Local trust · safe status · request clarity · progress | Request-only, no-charge, confirmed≠paid, safe checklist |
| **Violet** | Academy · AI · language · translation · learning | Modules, LeTan preview, translation pilot |
| **Gold** | Premium · account · business · highlighted value | Identity chrome, VIP highlight, featured listing — **not** paid/payout |
| **Magenta** | SOS · alert · risk · urgent | Emergency hub, warnings — **not** dispatch/rescue/auto-alert |
| **Assistant** | Pilot assistant (cyan-led + violet wash) | LeTan / intake — not autonomous production agent |

### 5.2 Multi-color examples by universe (controlled)

**Local** (leading: emerald): emerald request safety · cyan booking assist / transit / navigation · violet translation / AI receptionist preview · gold VIP / featured listing (no paid implication) · magenta warning/risk only.

**Travel** (leading: cyan): cyan airport / transit / navigation · gold hotel / premium planning · emerald food / local-safe recommendations · violet interpreter / language · magenta emergency / safety warning only.

**Academy** (leading: violet): violet learning / AI / language · cyan practice / interactive tools · gold achievement / highlight · emerald progress / success · magenta caution / safety notes only.

**Account** (leading: gold): gold account / value / identity surface · cyan security / settings · violet assistant / profile intelligence · emerald safe-looking in-app status (**not** KYC / government verification) · magenta warnings only.

**SOS** (leading: magenta): magenta emergency atmosphere · cyan call / navigation / tool actions · emerald safety checklist / safe status · gold important highlighted guidance (**not** paid) · violet rarely for language support.

**Home world cards (reference):** local=emerald, travel=cyan, academy=violet, business=gold, care=magenta — **leading** accents for universe **entry** only; interior hub grids still use §5.2.

### 5.3 Safety boundaries (color cannot imply)

| Color must **not** imply | Enforcement |
|--------------------------|-------------|
| Payment captured · settlement · payout · cash-out | Copy + chip text; gold/emerald never substitute for money law |
| KYC · government · legal verification | “Self-declared” / in-app only in text; emerald is not “verified identity” |
| Dispatch · rescue guarantee · auto-alert | Magenta on SOS is guidance-only; user dials local emergency |
| Production · commercial · Global Active readiness | No status chip or glow may claim launch/commercial |
| **Meaning from color alone** | **Text status chip required**; `accessibilityLabel` includes title + subtitle + status |

### 5.4 Forbidden glow use

| Forbidden | Why |
|-----------|-----|
| **Monochrome universe grids** (all tiles same accent without semantic reason) | Fails north-star; use per-tile `accent` |
| **Magenta** for normal commerce or booking | Reserves SOS / emergency attention |
| **Gold** to imply paid, settled, or commercial readiness | Pre-commercial pilot |
| **Emerald** to imply paid/settled when status is only **confirmed** | Confirmed ≠ paid on Local |
| **Glow without meaning** | Decoration-only halos dilute trust |
| **Full-card neon wash** on compact tiles | Edge-lit / chip glow only (Home world cards excepted) |

---

## 6. Copy rules

| Rule | Detail |
|------|--------|
| **Title** | Short, direct, verb or noun phrase; ≤~40 characters target in VI/EN |
| **Subtitle** | One line preferred; compact two lines max; explains outcome, not legal terms |
| **Safety on tiles** | Visible where relevant; not noisy — use status chip + one safety line in clarity block |
| **Avoid legalistic overload** | No T&C blocks on tiles |
| **Local forbidden words** | No **paid**, **settled**, **payout**, **cash-out**, **escrow**, **guaranteed** on consumer Local tiles |
| **Overclaim forbidden** | No production-ready, native PASS, Global Active, or full commercial claims |
| **i18n** | All new copy via locale keys; VI + EN parity for shipped strings |
| **Local-language readiness** | cs/de may lag — structure keys so expansion does not break layout |
| **Status chip vocabulary** | Use pilot-consistent set: `requestOnly`, `lite`, `pilot`, `demo`, `preview`, `comingSoon`, `gated` — document in clarity block |

---

## 7. Local-specific tile law

### 7.1 Protected invariants (must not regress)

| Invariant | Tile/display rule |
|-----------|-------------------|
| `REQUEST_ONLY_NO_CHARGE` | Status chip or wallet badge text on request surfaces |
| `walletPhase` **NONE** | Visible on My Requests rows |
| `paymentCaptured` **false** | “No payment has been captured” in user request copy |
| **Confirmed ≠ paid** | On CONFIRMED filter/row — dedicated note (not emerald “success” alone) |
| **No Ops Audit** on consumer tabs | Never tile-link Ops Audit for B2C |
| **No Local logic drift** | UX packs: copy/layout only |
| **No booking/payment implication** | Tiles say “request”, “assist”, “preview” — not “pay” or “book paid” |

### 7.2 Local tile display rules

| Element | Rule |
|---------|------|
| **Hub hero** | Chips: lite · pilot · **requestOnly** (`localCommerce.bookingStatus.*`) |
| **Clarity block** | Hero-tier; audience chips + status legend + `localCommerce.safety.bookingRequestNote` |
| **My Requests entry** | Dedicated `LocalAppTile`; `statusLabel=requestOnly`; navigates to status screen |
| **Module tiles** | `LocalAppTile` grid; each tile shows honest `statusLabel` |
| **Merchant/user clarity** | Separate packs for merchant vs user; do not merge into one ambiguous tile |

### 7.3 Relationship: tiles vs clarity block

```
[ Command rail ]
[ Hero intro + safety chips ]
[ LocalCommerceClarityBlock  ← status/safety tier ]
[ Section kicker ]
[ LocalAppTile ] [ LocalAppTile ] ...
```

Safety copy **must** remain visible without opening a tile. Tiles **repeat** mode at module level; clarity block **defines** the legend.

---

## 8. Universe-specific application

| Universe | Recommended tile role | Semantic accent | Copy density | Safety / i18n | Impl. risk |
|----------|----------------------|-----------------|--------------|---------------|------------|
| **Home** | Hero world cards + command bar | Per-world emerald/cyan/violet/gold | Low on cards; avoid hardcoded EN in new work | SOS via modals, not tile overclaim | **HIGH** (monolith) |
| **Local** | `PremiumAppTile` + clarity block | Leading emerald; **multi-color per §5.2** | Low per tile; clarity block medium | **Strong** — confirmed≠paid in text | Refine: `LOCAL_SEMANTIC_COLOR_BALANCE.1` |
| **Travel** | `PremiumAppTile` scenario groups | Leading cyan; **multi-color per §5.2** | Low | Location consent separate from tiles | **MEDIUM** |
| **Academy** | `PremiumAppTile` modules | Leading violet; **multi-color per §5.2** | Medium (body up to 4 lines) — **max density** | Paywall off-tab | **LOW–MEDIUM** |
| **Business entry** | Home `VionaFashionWorldCard` only | Leading gold | Low; pre-commercial tone | No revenue/settlement on entry card | **HIGH** if editing dashboard |
| **Account** | `PremiumAppTile` grid | Leading gold; **multi-color per §5.2** — not monochrome gold | Medium sections | Trust history; no wallet expansion | Refine after screenshot QA |
| **SOS** | `PremiumAppTile` hub | Leading magenta; **multi-color per §5.2** | Low + disclaimer panel | Disclaimers required; no dispatch claim | **LOW** UX; **HIGH** copy claims |
| **LeTan** | Entry prefill only | Cyan assist | N/A in chat | No payment promise in prompts | **HIGH** logic |

---

## 9. Forbidden patterns

| Pattern | Reason |
|---------|--------|
| Long horizontal **dashboard rows** for consumer modules | Violates scan-first tile grammar |
| **Icon-only** cards without title | Fails accessibility and clarity |
| **Dense paragraph** cards in module grids | Use detail screen |
| **Mixed grammars** in same grid (e.g. `PrecisePanel` + `LocalAppTile`) | Harmonize in dedicated packs |
| **Consumer exposure** of admin/ops panels | Ops Audit, merchant radar tables |
| **Fake** production / commercial / native / Global Active claims | Locked zones |
| **Commerce wording** before finance approval | Pre-commercial pilot |
| **Touching Local service logic** in UX-only packs | Wave 1 evidence / money law |
| **Gold glow** on “payment success” before commercial wave | Misleading |
| **Emerald glow** on confirmed Local request without “not paid” note | Misleading |
| Extending Home **briefing rail** for new modules | Use world cards or hub tiles |

---

## 10. Responsive rules

### Required QA viewports

| Viewport | Expectation |
|----------|-------------|
| **390×844** | 1–2 col grids; no clipped title/subtitle; safety block visible above fold |
| **768×1024** | 2–3 col grids; command rail wraps without crushing tiles |
| **1024×768** | Home world row / Travel 3-col; hierarchy preserved |
| **1366×768** | Home 4-across world cards; Travel 4-col max — verify min tile width |

### Layout expectations

- No clipped title/subtitle at any viewport (`numberOfLines` + grid column math).  
- No overcrowded grids — reduce columns before shrinking text below 10px subtitle.  
- Touch targets **≥44px** on pressable wrapper.  
- Hero and compact tiles share **one row height** per row where `stretchInColumn` / grid math applies.  
- Important safety copy remains visible without horizontal scroll (except status chip legend scroll in clarity block).

---

## 11. Accessibility rules

| Rule | Detail |
|------|--------|
| **Readable hierarchy** | Title stronger than subtitle; status chip distinct but not sole signal |
| **Tap target** | Min 44×44px pressable; icon chip may be 44px |
| **Meaning not color-only** | Status chip text + title; SOS also uses icon + label |
| **Badges have text** | No color-only dots |
| **Subtitle size** | Not below 10px effective on mobile |
| **Contrast on glass** | Use `inkStrong` / scrim patterns from constellation tokens |
| **Screen readers** | `accessibilityLabel` includes title and subtitle when icon present |
| **Motion** | Respect reduced motion; animated neon rim optional and subtle |

---

## 12. Recommended implementation sequence

After this rules pack (per surface audit):

| Order | Pack | Type |
|-------|------|------|
| 1 | `WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY_VISIBILITY.1` | Copy / micro-UI |
| 2 | `WAVE_3.LOCAL_USER_STATUS_CLARITY.1` | Small UI |
| 3 | `WAVE_3.LOCAL_MERCHANT_STATUS_CLARITY.1` | Small UI |
| 4 | `WAVE_3.TRAVEL_PREMIUM_TILE_ALIGN.1` | Small UI |
| 5 | `WAVE_3.ACADEMY_PREMIUM_TILE_ALIGN.1` | Small UI |
| 6 | `WAVE_3.BUSINESS_ENTRY_CLARITY.1` | Small UI |
| 7 | `WAVE_3.ACCOUNT_SURFACE_CLARITY.1` | Small UI |
| 8 | `WAVE_3.SOS_ENTRY_CLARITY.1` | Copy / micro-UI |
| 9 | `WAVE_3.RESPONSIVE_MATRIX.1` | QA |
| 10 | `WAVE_3.UX_READINESS_REVIEW.1` | Docs review |

**Do not** start broad `HomeScreen` refactor until Packs 1–3 prove Local trust copy on staging.

---

## 13. First implementation recommendation

**Next pack (one only):** `VIONA.WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY_VISIBILITY.1`

| Why | Detail |
|-----|--------|
| **Trust-first** | Surface audit gap: “confirmed ≠ paid” stronger on My Requests than hub |
| **Small scope** | Clarity block + hero chips + legend link — no booking/wallet logic |
| **Rules-compliant** | Implements §7 status/safety tier without new tile primitives |
| **After this commit** | Rules doc must be on `master` before UI pack starts |

---

## 14. Locked zones (unchanged)

| Zone | Status |
|------|--------|
| Payment / wallet / commercial implementation | **Locked** |
| Hold / debit / release / refund | **Locked** |
| Settlement / payout / cash-out / escrow | **Locked** |
| Production admin claim | **Locked** |
| Autonomous AI | **Locked** |
| SOS production reliability claim | **Locked** |
| Global Active / full commercial claim | **Locked** |
| Native PASS without attestation | **Locked** |

---

## 15. Component mapping (reference only — no extraction in this pack)

| Grammar tier | Primary components |
|--------------|-------------------|
| Hero universe | `VionaFashionWorldCard` |
| Compact module | `LocalAppTile`, `TravelAppTile` |
| Module + body | `AcademyGlassCard` |
| Safety / status | `LocalCommerceClarityBlock`, `EmergencyHubTile` |
| Frame / tokens | `LocalConstellationFrame`, `TravelGlassCard`, `fashionHomeDesktopShell` |

Future shared primitive extraction is **out of scope** until Wave 3 readiness review.

---

## 16. Related documents

| Doc | Role |
|-----|------|
| `VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md` | Wave 3 prep |
| `VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md` | Surface inventory |
| `VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md` | Experience principles |
| `VIONA_ACTION_GRID_PATTERN.md` | Account action grid |
| `VIONA_NEON_GLASS_CARD_SYSTEM.md` | Glass material depth |
