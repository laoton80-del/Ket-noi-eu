# VIONA Wave 3B — Visual Wow Gap Audit

**Pack:** `VIONA.WAVE_3B.VISUAL_WOW_GAP_AUDIT.1`  
**Status:** **COMPLETE (docs/static)** — no implementation, no unstaged files staged  
**Date (UTC):** 2026-05-20  
**Visual north-star:** **Premium App Tiles — Universe Standard** (uploaded reference; design law also in `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md`)  
**Classification:** Gap audit — **not** production launch, **not** commercial/Global Active, **not** native PASS

---

## 1. Baseline

| Item | Value |
|------|--------|
| **master / origin at audit** | `68ea9ee` — `docs(merchant): prepare Wave 4 onboarding foundation` |
| **Wave 3** | **Closed — PARTIAL PASS** (clarity, safety, tile **grammar**; limited visual wow) — `VIONA_WAVE_3_CLOSEOUT.md` |
| **User observation** | Committed UI still feels **old** vs north-star — lacks depth, semantic glow intensity, unified dark premium field |
| **Wave 3B** | New track: **visual wow layer** on top of Wave 3 grammar — not Wave 4 merchant onboarding |
| **Wave 2 native** | **NOT COMPLETED** |
| **VIONA state** | Pre-commercial / staging-pilot |
| **Global Active / full commercial** | **Not yet** |
| **Working tree** | 11 files show `M` but **`git diff HEAD` is empty** (CRLF/working-tree noise only — **no incremental visual diff** to review) |

---

## 2. Honest diagnosis — why the app still looks old

Wave 3 succeeded at **copy, safety, and tile anatomy** (title/subtitle/chip, `numberOfLines`, pilot strips). It did **not** deliver a cohesive **visual wow layer** matching the north-star. Root causes:

| Gap category | Present in committed code? | Impact vs north-star |
|--------------|------------------------------|----------------------|
| **Dark premium material depth** | **Partial** — Local/Travel/Academy hubs use dark canvases (`#050B14`, travel cyan veils); **status screens** and some shells use `theme.colors.background` (lighter legacy) | Hubs feel “almost premium”; list screens feel **flat / old app** |
| **Semantic glow intensity** | **Partial** — glow exists (`localConstellation.glow*`, `TravelGlassCard` gradients) but often **low opacity** (0.12–0.16); corner washes subtle | Reference reads **luminous**; committed reads **muted** |
| **Icon capsule consistency** | **Partial** — Local 44×44, Travel capsule, Academy uses account-neon roles; **no single shared capsule primitive** | Slight size/material drift between universes |
| **Grid density / compact tiles** | **Partial** — Local/Travel grids match 2/3/4 col logic; **Home** uses **large world cards** (~168px+), not compact app-tile grid | Home dominates first impression → “not the reference” |
| **Migration from dashboard rows** | **Incomplete** — Home **briefing rail**, collapsible `DashboardB2CScreen`, `VionaInfoTile`-style patterns remain | **Dense row / dashboard** feel on Home |
| **Visual state system** | **Fragmented** — 4+ glass stacks: `LocalConstellationFrame`, `TravelGlassCard`, `AcademyGlassCard` (account neon), `AccountNeonGlassPanel`, `VionaFashionWorldCard`, `EmergencyHubTile` | Inconsistent depth, blur, and glow curves |
| **Responsive pixel QA** | **Weak** — Wave 3 visual spot-check was **projection-only**; no screenshot artifacts | “Old” may be **real clipping** on device, not just tokens |
| **Shared token/component reuse** | **Landed** — `PremiumAppTile` + tokens; **governance corrected** @ SEMANTIC_COLOR_GOVERNANCE.1 (multi-color per feature, not one color per universe) | Future packs must use `accent` overrides per §5.2 |

**Conclusion:** Wave 3 was a **grammar pass**, not a **material system pass**. The north-star requires **shared tokens + one tile primitive + hub canvas alignment + Home restraint** — implemented in small packs, not one rewrite.

---

## 3. Surface-by-surface gap table

Ratings vs **Premium App Tiles — Universe Standard**.  
**GREEN** = close on committed hub; **YELLOW** = grammar OK, wow/material gap; **RED** = material mismatch or legacy dominant.

| Surface | Quality | Gap vs reference | Required improvement | Risk | Recommended pack |
|---------|---------|------------------|----------------------|------|------------------|
| **Home** | **YELLOW** | Large image world cards + briefing rail; not compact 2-col tile grid; mixed daylight/glass paths | Defer broad rewrite; later **shell alignment** only (pack G) | **HIGH** scope creep | `WAVE_3B.HOME_SHELL_ALIGNMENT.1` (after hubs) |
| **Local hub** | **YELLOW→GREEN (partial)** | Fix pack landed compact grids + emerald glow; classifieds still row-like | Manual screenshot pass at 4 viewports | LOW | `WAVE_3B.LOCAL_VISUAL_WOW_FIX.1` done |
| **Local My Requests** | **YELLOW** | `theme.colors.background`; cards OK grammar, **weak glass field** | Dark canvas + constellation frame on list/cards | LOW | `WAVE_3B.LOCAL_STATUS_VISUAL.1` |
| **Local merchant inbox** | **YELLOW** | Same legacy background as user status | Match Local hub canvas + tile frames | LOW | `WAVE_3B.MERCHANT_INBOX_VISUAL.1` |
| **Travel** | **YELLOW** | Strong `TravelGlassCard`; 4-col @ 1024+ tight; glow busy on web | Tune glow multipliers; verify 3-col @ 768 | LOW | `WAVE_3B.TRAVEL_VISUAL_WOW.1` |
| **Academy** | **YELLOW** | Violet canvas OK; reuses account-neon stack; module cards taller than compact ref | Align to compact tile height (~108–120px) | LOW | `WAVE_3B.ACADEMY_VISUAL_WOW.1` |
| **Business entry** | **YELLOW** | World card pattern (hero-scale), not compact tile | Pilot chip OK; visual = Home dependency | MEDIUM | With Home pack G |
| **Account** | **YELLOW→GREEN (partial)** | Wave 3B tiles on shortcuts/settings; profile/credits panels retain neon glass | Manual screenshot pass | LOW | Fix pack done |
| **SOS** | **YELLOW→GREEN (partial)** | Hub on `PremiumAppTile`; type selector + dial CTA unchanged | Manual screenshot pass | LOW | Fix pack done |
| **LeTan (reference)** | **RED** | Chat rows, legacy banners, wallet-adjacent UI — **not** tile universe | Out of 3B; risk surface only | HIGH if touched | No pack in 3B |

### Responsive grid vs reference (committed logic)

| Viewport | Reference | Committed (hubs) | Gap |
|----------|-----------|------------------|-----|
| 390×844 | 2 col | Local/Travel 2 col @ ≥360 | **OK** |
| 768×1024 | 3 col | Local/Travel 3 col @ ≥768 | **OK** |
| 1024×768 | 3–4 col | Local/Travel 4 col @ ≥1024; Academy 3 col | Travel 4-col **dense** (YELLOW) |
| 1366×768 | 4 col | Same | Travel subtitle ellipsis risk |

---

## 4. Unstaged file audit

**Important:** All 11 files are marked modified in `git status`, but **`git diff HEAD` produces no hunks** (line-ending / index noise on Windows). There is **no separate unstaged visual layer** to merge — audit uses **committed** file contents only.

| File | Purpose (committed) | Useful for wow layer? | Risk | Recommended action |
|------|---------------------|------------------------|------|---------------------|
| `LocalConstellationFrame.tsx` | Glass frame, blur, corner glow for Local | **YES** (already core) | MEDIUM — extend, don’t fork | **Keep** — evolve via token pack A |
| `localConstellationTokens.ts` | Emerald/cyan/gold/violet canvas + glow | **YES** | LOW | **Keep** — centralize into shared map |
| `IdentityGlassTextField.tsx` | Setup profile neon inputs | **YES** (SetupProfile only) | LOW | **Split** — `WAVE_3B.SETUP_PROFILE_GLASS.1` later |
| `IdentitySelectorCard.tsx` | Setup profile selectors | **YES** (SetupProfile only) | LOW | Same split pack |
| `VionaFashionHomeCommandBar.tsx` | Home command rail chrome | **YES** for Home pack G | **HIGH** scope | **Keep for later** — do not stage in 3B |
| `fashionHomeDesktopShell.ts` (components) | Home glass lines, world card web CSS | **YES** for Home | **HIGH** | **Keep for later** — pack G only |
| `viona/index.ts` | Barrel exports | **UNKNOWN** without diff | LOW | **Audit deeper** on next Home pack |
| `design/index.ts` | Re-exports `neonGlassCardTokens` | **YES** | LOW | **Keep** — wire in token pack A |
| `navigation/fashionHomeDesktopShell.ts` | Breakpoints / tab shell constants | **NO** for tile wow | LOW | **Discard/reset** noise if `M` is CRLF-only |
| `LeTanScreen.tsx` | AI chat surface | **NO** for consumer tile wow | **HIGH** | **Do not stage** — out of 3B |
| `SetupProfileScreen.tsx` | Profile onboarding | **PARTIAL** | MEDIUM | **Split** — after consumer hubs |

**Staging discipline:** **Do not stage** any of the above in Wave 3B until a named pack owns the file. Optional: `git restore` the 11 paths to clear CRLF noise after audit approval.

---

## 5. Visual system recommendation

VIONA needs a **thin shared layer** (docs + small code packs), not a monolith:

| Building block | Recommendation |
|----------------|----------------|
| **Shared glow + glass material tokens** | `vionaPremiumGlassTokens.ts` — blur tiers, slab fills, semantic glow opacities (reference: stronger rim + corner wash) |
| **Universe accent map** | `universeAccent.ts` — cyan/emerald/violet/gold/magenta → stroke, glow, wash, ink |
| **Shared icon capsule** | `PremiumIconCapsule` — 32–44px, semantic border, contained glow |
| **Shared PremiumTile** | `PremiumAppTile` — icon row + status chip + title + subtitle; adapters for Local/Travel/Academy |
| **Responsive grid helper** | Extend `resolveLocalGridColumns` / `travelScenarioGridColumns` → `resolvePremiumTileColumns(width)` |
| **Canvas primitive** | `PremiumHubCanvas` — dark field `#050B14`, veils, optional constellation backdrop |

**Do not** delete existing tiles in pack A — **wrap/adapt** first to reduce risk.

---

## 6. Implementation sequence (safe small packs)

| Order | Pack ID | Scope |
|-------|---------|--------|
| **A** | `VIONA.WAVE_3B.PREMIUM_TILE_VISUAL_TOKENS.1` | Shared tokens + accent map + grid helper (no screen rewrites) |
| **B** | `VIONA.WAVE_3B.PREMIUM_APP_TILE_COMPONENT.1` | `PremiumAppTile` + capsule; thin adapters |
| **C** | `VIONA.WAVE_3B.LOCAL_VISUAL_WOW.1` | Local hub canvas intensity + `LocalAppTile` → adapter |
| **D** | `VIONA.WAVE_3B.TRAVEL_VISUAL_WOW.1` | Travel glow tuning + column verify @ 1024 |
| **E** | `VIONA.WAVE_3B.ACADEMY_VISUAL_WOW.1` | Compact module height + violet glass alignment |
| **F** | `VIONA.WAVE_3B.ACCOUNT_SOS_VISUAL.1` | Account grid + SOS hub tiles on shared material |
| **G** | `VIONA.WAVE_3B.HOME_SHELL_ALIGNMENT.1` | Command rail + world card glow only — **no** full Home rewrite |
| **H** | `VIONA.WAVE_3B.LOCAL_STATUS_VISUAL.1` | User + merchant status screens dark canvas |
| **I** | Manual screenshot QA | Store artifacts; compare to north-star image |

**Parallel allowed:** Wave 2 RUN.2, Wave 4 merchant **docs** (not implementation).

---

## 7. First implementation recommendation

**Start with:** `VIONA.WAVE_3B.PREMIUM_TILE_VISUAL_TOKENS.1`

| Reason |
|--------|
| Zero screen layout risk |
| Unblocks all hub packs with one accent/glow source of truth |
| Makes north-star measurable (opacity, blur, rim width) |
| Avoids staging the 11 noisy paths until intentional |

**Do not start with:** Home rewrite, LeTan, or merchant onboarding.

---

## 8. Locked zones (unchanged)

Still **locked:**

- Payment / wallet / commercial implementation  
- Hold / debit / release / refund  
- Settlement / payout / cash-out / escrow  
- Production admin claim  
- Autonomous AI execution  
- SOS production reliability / dispatch  
- Global Active / full commercial claim  
- Native PASS until hardware attestation  

Visual wow packs must **not** introduce commercial/payment copy or behavior.

---

## 9. Non-goals (Wave 3B program)

- Not Wave 4 merchant onboarding implementation  
- Not broad Home rewrite or briefing/dashboard removal in pack A–F  
- Not commercial launch or production readiness claims  
- Not marketing screenshot asset pack (pack I optional)  
- Not staging the 11 `M` files without an owning pack  

---

## 10. Related documents

| Document | Role |
|----------|------|
| `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Grammar law (north-star text) |
| `VIONA_WAVE_3_CLOSEOUT.md` | Wave 3 closed; wow gap acknowledged |
| `VIONA_WAVE_3_VISUAL_SPOT_CHECK.md` | Projection-only QA |
| `VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` | Wave sequencing |
| `VIONA_PROJECT_KERNEL.md` | Money law + program identity |

---

## 11. Implementation status

| Pack | Status |
|------|--------|
| **`VIONA.WAVE_3B.PREMIUM_TILE_VISUAL_TOKENS.1`** | **COMPLETE** — `src/design/premiumTileVisualTokens.ts` exported via `src/design/index.ts`. Foundation tokens only; **no surfaces refactored**. UI does **not** yet match the north-star image. |
| **`VIONA.WAVE_3B.PREMIUM_APP_TILE_COMPONENT.1`** | **COMPLETE** — `PremiumAppTile`, `PremiumIconCapsule`, `PremiumStatusChip`, `PremiumTileGrid` exported from `src/components/viona/index.ts`. **No hub screens refactored yet.** |
| **`VIONA.WAVE_3B.LOCAL_VISUAL_WOW.1`** | **COMPLETE** — first hub tile migration (see fix pack below). |
| **`VIONA.WAVE_3B.LOCAL_VISUAL_WOW_FIX.1`** | **COMPLETE** — compressed hero; clarity block → compact premium tile grids; merged service grid; connected universes → semantic `PremiumAppTile` grid; stronger emerald glass tokens; extra bottom scroll clearance. Screenshots **NOT RUN**. |
| **`WIONA.WAVE_3B.TRAVEL_VISUAL_WOW.1`** | **COMPLETE** — `TravelScreen` scenario + quick-help tiles → `PremiumAppTile` + `PremiumTileGrid`; pilot pills use cyan Wave 3B tokens. `TravelAppTile` retained for other imports only if unused in hub. Screenshots **NOT RUN**. |
| **`WIONA.WAVE_3B.ACADEMY_VISUAL_WOW.1`** | **COMPLETE** — `AcademyScreen` module grid → `PremiumAppTile` + `PremiumTileGrid`; violet pilot pills use Wave 3B tokens. Hero/safety panels unchanged. Screenshots **NOT RUN**. |
| **`VIONA.WAVE_3B.ACCOUNT_SOS_VISUAL_WOW.1`** | **COMPLETE** — `CaNhanScreen` shortcuts/settings → `PremiumAppTile` grids; `EmergencyHubTile` → `PremiumAppTile` (sos); `EmergencySOSScreen` hub grid + magenta pilot chips. Screenshots **NOT RUN**. |
| **`VIONA.WAVE_3B.SEMANTIC_COLOR_GOVERNANCE.1`** | **COMPLETE** — docs + token comments: leading vs feature accent; controlled multi-color law; safety boundaries. **No screen changes.** |
| **`VIONA.WAVE_3B.LOCAL_SEMANTIC_COLOR_BALANCE.1`** | **COMPLETE** — `LocalScreen` + `LocalCommerceClarityBlock` per-feature `accent` (emerald/cyan/violet/gold/magenta); mode chips multi-color; capability icons. |
| **`VIONA.WAVE_3B.LOCAL_MANUAL_SCREENSHOT_QA.1`** | **COMPLETE (PARTIAL)** — artifacts @ `docs/design/evidence/wave-3b-local/`; see `VIONA_WAVE_3B_LOCAL_MANUAL_SCREENSHOT_QA.md`. |

---

## 12. Next action

| Priority | Action |
|----------|--------|
| **1** | Account/SOS screenshot QA or Home shell alignment (pack G) |
| **2** | Optional manual screenshot pass (Account, SOS, Local at 4 viewports) — verify multi-color reads intentional |
| **3** | Home shell alignment (pack G) later |
| **3** | Optional: `git restore` 11 CRLF-noise paths after leadership confirms no lost local work |
| **4** | Manual screenshot pass (pack I) before external demo |

---

**Signoff:** Gap audit **complete**. UI feels old because **material system and Home scale** lag the north-star, not because Wave 3 safety/copy failed. Wave 3B is the **approved track** to close that gap in controlled packs.
