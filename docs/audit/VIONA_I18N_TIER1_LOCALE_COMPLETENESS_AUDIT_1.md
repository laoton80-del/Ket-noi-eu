# VIONA.I18N.TIER1_LOCALE_COMPLETENESS_AUDIT.1

**Document ID:** `VIONA.I18N.TIER1_LOCALE_COMPLETENESS_AUDIT.1`  
**Type:** Read-only Tier-1 locale completeness & safety audit (report only)  
**Branch:** `pack-af15-tier1-locale-completeness-audit`  
**Base master:** `32b0482` — `fix(i18n): merge loyalty brand cleanup`  
**Prior waves:** Brand drift merge (`d044174`), global language strategy (`e039ed0`), loyalty catalog brand (`a382fbb` / `32b0482`)  
**Date:** 2026-05-16  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §1.1, [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md), [Global Language Strategy](./VIONA_I18N_GLOBAL_LANGUAGE_STRATEGY_AUDIT_1.md), [Brand Drift Sweep](./VIONA_I18N_BRAND_DRIFT_SWEEP_1.md).

**Product vision (not changed by this audit):** VIONA targets **Active / Full globally** for the entire app. **Lite / Pilot / Demo** in this report describe **locale and surface implementation readiness** only — not a strategic decision to limit markets or universes. Missing keys or stub namespaces are **progress**, not product scope removal.

**Runtime note:** `src/i18n/index.ts` registers `en`, `vi`, `cs`, `de`, `fr`, `ko`, `ja` with `fallbackLng: 'en'` and `mergeSosWithEnglishBase()` for non-EN `sos` objects. **Missing keys resolve to English** unless a locale file overrides the same path.

**Post-audit note:** `VIONA.I18N.TIER1_CS_DE_COMPLETION.1` may land after this audit snapshot; refresh key counts from `cs.json` / `de.json` when comparing coverage — global Active/Full target is unchanged regardless.

---

## Summary

| Item | Result |
|------|--------|
| **Overall readiness** | **Tier 1 locale implementation is pilot / stub** — not full native UI launch. Safe for **global demo** when users accept **EN fallback** for uncovered surfaces. **Markets remain in global product scope.** |
| **Current locale coverage** | `en`/`vi` ~100% key parity (~1,402 leaf keys); `cs`/`de` ~9.3%; `fr`/`ja`/`ko` ~3.9% |
| **Highest risk gaps** | No localized `checkout` / `emergencySos` / `home` / `travelHub` / `localHub` in any Tier-1 file; `fr`/`ja`/`ko` lack `login` and root shell strings; stub `fallbackLabel` English leaks on merchant/ops namespaces |
| **Recommended next pack** | **`VIONA.I18N.TIER1_CS_DE_COMPLETION.1`** (implementation), then **`VIONA.I18N.TIER1_FR_JA_KO_SAFETY_BUNDLE.1`** |

---

## Current locale inventory

| Code | File | Bytes (approx) | Leaf keys | Top namespaces | Tier (strategy doc) |
|------|------|----------------|-----------|----------------|---------------------|
| `en` | `en.json` | 87 KB | 1,402 | 34 | **Tier 0** — canonical + `fallbackLng` |
| `vi` | `vi.json` | 98 KB | 1,402 | 34 | **Tier 0** — full parity with `en` |
| `cs` | `cs.json` | 7.6 KB | 131 | 19 | **Tier 1 pilot** (CZ) |
| `de` | `de.json` | 7.6 KB | 131 | 19 | **Tier 1 pilot** (DE) |
| `fr` | `fr.json` | 4.1 KB | 54 | 12 | **Tier 1 stub** (FR) |
| `ja` | `ja.json` | 4.2 KB | 54 | 12 | **Tier 1 stub** (JP) |
| `ko` | `ko.json` | 4.2 KB | 54 | 12 | **Tier 1 stub** (KR) |

**Smart Trio matrix** (`MARKET_LANGUAGE_CONFIG`): CZ → `cs`, DE → `de`, FR → `fr`, JP → `ja`, KR → `ko` — all include `vi` + `en` + native.

---

## Key coverage comparison

### en vs vi

| Metric | Value |
|--------|--------|
| Leaf keys | 1,402 / 1,402 (100%) |
| Top-level namespaces | 34 / 34 identical set |
| Parity | **Complete** for bundled JSON (production copy still subject to per-release safety review) |

### en vs Tier-1 (top-level namespaces)

| Namespace group | `cs` | `de` | `fr` | `ja` | `ko` |
|-----------------|------|------|------|------|------|
| Root (`welcome_message`, `book_now`, …) | Yes | Yes | **No** | **No** | **No** |
| `login` | Yes | Yes | **No** | **No** | **No** |
| `shell` / `home` | **No** | **No** | **No** | **No** | **No** |
| `sos` (partial overlay) | 21 keys | 21 keys | 22 keys | 22 keys | 22 keys |
| `emergencySos` / `travelSosHub` / `sosPlus` | **No** | **No** | **No** | **No** | **No** |
| `vietnamHub` / `tourism` | Yes | Yes | Hub only | Hub only | Hub only |
| `travelHub` / `travel` | Hub **No** / stub | same | **No** / stub | same | same |
| `localHub` / `localCommerce` | Hub **No** / stub | same | **No** / stub | same | same |
| `academyHub` / `academySub` / `academyLive` | **No** | **No** | **No** | **No** | **No** |
| `checkout` | **No** | **No** | **No** | **No** | **No** |
| `authPaywall` | **No** | **No** | **No** | **No** | **No** |
| `smartTrio` | stub | stub | stub | stub | stub |
| `b2b` / merchant ops stubs | partial `b2b` | partial | stubs only | stubs only | stubs only |

**Missing vs `en` (count):** `cs`/`de` — **15** top-level namespaces; `fr`/`ja`/`ko` — **22**.

### Critical namespaces for product audit

| Critical area | Required keys (representative) | Tier-1 file presence |
|---------------|-------------------------------|----------------------|
| Common / navigation | `shell.*`, `home.tab*` | **Absent** — EN fallback |
| Home / LifeOS | `home.*` | **Absent** |
| SOS modal | `sos.guideTitle`, `sos.reportScamSub`, `sos.footerDisclaimer`, … | **Partial overlay** + EN merge |
| Travel | `travelHub.*`, `travel.*` | **Absent** / stub `fallbackLabel` only |
| Local | `localHub.*`, `localCommerce.*` | **Absent** / stub |
| Academy | `academyHub.*`, `academySub.*` | **Absent** — EN fallback |
| Account / setup | `login.*`, `authPaywall.*` | **cs/de only** for `login` |
| Checkout / payment / legal | `checkout.*` | **Absent** — EN fallback (post–#52 wave EN is safe) |
| Loyalty / VIO | Mostly `getStrings` / screens, not `en.json` loyalty namespace | N/A in locale files |

---

## Safety-critical coverage

Post–brand-drift wave (`bfb7c40`, `0712b0e`, `6db940a`, `32b0482`), **canonical safety strings live in `en.json` / `vi.json`**. Tier-1 locales inherit via fallback unless they override the same key.

### cs (Czech)

| Area | Status | Notes |
|------|--------|-------|
| SOS overlay (`sos.*`, 21 keys) | **Safe for demo** | `reportScamSub`, `reportQueuedBody`, `gpsShareDetail` neutralized — no auto-alert / live dispatch / authority contact claims |
| SOS keys used by `SOSModal` not in overlay | **EN via merge + fallback** | e.g. `sos.guideTitle`, `sos.medicalTitle`, `sos.footerDisclaimer` |
| `emergencySos` / `sosPlus` | **EN fallback** | Not in `cs.json` |
| `checkout` | **EN fallback** | Inherits safe preview copy from EN |
| `vietnamHub` / `tourism` | **Localized** | Uses **VIO Credits** in `fromPrice` |
| `b2b` | **Localized** | `{{vig}}` is interpolation variable name only — not public “VIG Token” label |

**Classification:** **Pilot partial** — OK for CZ device language on inbound/tourism/SOS slice; **not** market launch.

### de (German)

| Area | Status | Notes |
|------|--------|-------|
| SOS overlay | **Safe for demo** | Same pattern as `cs`; `reportScamSub` explicitly denies auto alarm and location share |
| Other critical namespaces | Same as `cs` | ~9% key coverage |

**Classification:** **Pilot partial** — same as CZ.

### fr (French)

| Area | Status | Notes |
|------|--------|-------|
| `sos` | **Safe for demo** | Modern keys; no dispatch/GPS-share promises in scanned strings |
| `vietnamHub` | **Localized** | VIO Credits, VIONA kicker |
| `login` / `checkout` / `home` | **EN fallback** | Missing namespaces |
| `smartTrio`, `travel`, `localCommerce`, AI ops | **English stub** `fallbackLabel` | Visible if those keys are hit — honest but not localized |

**Classification:** **Stub-only** — safe SOS/hub slice; **do not** market as French app.

### ja (Japanese)

Same as `fr` — **stub-only**, SOS/hub safe, EN fallback elsewhere.

### ko (Korean)

Same as `fr` — **stub-only**, SOS/hub safe, EN fallback elsewhere.

---

## Unsafe wording scan

**Method:** ripgrep on `src/i18n/locales/{cs,de,fr,ja,ko}.json` for dispatch, GPS shared to authorities, payment success, booking confirmed, KNG, VIG Token, ViGlobal, withdrawable, crypto (2026-05-16).

| Pattern | cs | de | fr | ja | ko |
|---------|----|----|----|----|-----|
| Fake emergency dispatch / live monitoring | **None** | **None** | **None** | **None** | **None** |
| Fake GPS share to VIONA center | **None** (fixed) | **None** (fixed) | **None** | **None** | **None** |
| `KNG` / `VIG Token` / `ViGlobal` public | **None** | **None** | **None** | **None** | **None** |
| Fake payment / booking / refund in locale files | **None** | **None** | **None** | **None** | **None** |
| `{{vig}}` in `b2b.stats.revenueLine` | Present | Present | N/A | N/A | N/A |

**Residual risks (runtime, not bad translation):**

1. **EN fallback** on `checkout` / `home` for Tier-1 users may feel “English app with Czech menu” — product honesty issue, not safety.
2. **`fallbackLabel` English stubs** on `fr`/`ja`/`ko` (and cs/de ops namespaces) — must not ship as “fully localized.”
3. **Stale SOS key names** in cs/de (`medicalAmbulance`, etc.) overlap EN paths but **`SOSModal` uses `medicalTitle`** — overrides are mostly harmless; recommend pruning stale keys in a hygiene pack.
4. **fr/ja/ko orphan SOS keys** (`optionMedicalTitle`, …) not in `en.json` — unused by current `SOSModal`; low risk.

---

## Rollout decision

**Scope clarification:** Rows below judge **locale / UX implementation readiness**, not whether CZ, DE, FR, JP, or KR are in VIONA’s product roadmap (they are — see [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md)).

| Gate | cs | de | fr | ja | ko |
|------|----|----|----|----|-----|
| **Tier 1 demo readiness** (device lang + EN fallback acceptable) | **Yes** | **Yes** | **Yes** (label stub) | **Yes** (label stub) | **Yes** (label stub) |
| **Tier 1 pilot readiness** (market pilot with honest “Preview · EN bridge”) | **Partial** | **Partial** | **No** (stub) | **No** (stub) | **No** (stub) |
| **Full native UI launch readiness** | **No** | **No** | **No** | **No** | **No** |
| **Strategic market in global Active/Full scope** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |

**Safety-critical translation bundle required before any market launch** (human-reviewed, per locale):

1. **SOS** — full `sos.*`, `emergencySos.*`, `travelSosHub.*`, `sosPlus.*` (no unsafe overrides)  
2. **Checkout / payment** — `checkout.*`, commercial payment sheet strings (or inherit EN verbatim until translated)  
3. **Legal / privacy / consent** — auth, paywall, recording, location  
4. **Wallet / VIO** — credits disclaimers (not cash, crypto, withdrawable)  
5. **Booking / fulfillment** — preview-only confirmation language  
6. **AI disclaimers** — teacher, receptionist, cost caps  

Until then: **`fallbackLng: 'en'` is the safety backstop** for Tier-1.

---

## Recommended next packs

### 1. `VIONA.I18N.TIER1_CS_DE_COMPLETION.1` (implementation — P1)

| Field | Value |
|-------|--------|
| **Target locales** | `cs`, `de` |
| **Target namespaces** | `home`, `travelHub`, `travel`, `localHub`, `localCommerce`, `checkout`, `shell`, `emergencySos`, `smartTrio` (real keys, not stubs) |
| **Type** | Locale JSON + LQA |
| **Risk** | Medium — avoid new SOS overrides without Trust & Safety review |
| **Exit** | ≥40% en key coverage for pilot surfaces; no raw keys on CZ/DE primary flows |

### 2. `VIONA.I18N.TIER1_FR_JA_KO_SAFETY_BUNDLE.1` (implementation — P1)

| Field | Value |
|-------|--------|
| **Target locales** | `fr`, `ja`, `ko` |
| **Target namespaces** | Safety bundle only: `login`, `sos` (align keys to `en` schema), `checkout`, `tourism`, `vietnamHub`; replace `fallbackLabel` stubs with real or remove namespaces from picker until ready |
| **Type** | Locale JSON |
| **Risk** | High if SOS mistranslated — copy EN-safe strings first, then LQA |
| **Exit** | Stub namespaces gone or marked Preview; safety bundle 100% reviewed |

### 3. `VIONA.I18N.SAFETY_BUNDLE_EXTRACT.1` (implementation — P2)

| Field | Value |
|-------|--------|
| **Target** | Shared `safety-en.json` imported by all locales; document forbidden override list |
| **Type** | Structural i18n + docs |
| **Risk** | Low if behavior unchanged |
| **Exit** | No locale can override safety keys without explicit allowlist |

### 4. `VIONA.I18N.TIER1_LOCALE_COVERAGE_TEST.1` (implementation — P2)

| Field | Value |
|-------|--------|
| **Target** | CI script: namespace coverage % vs `en`, fail on raw `fallbackLabel`, fail on forbidden SOS phrases |
| **Type** | Test harness |
| **Risk** | Low |

### 5. `VIONA.I18N.OPERATING_PROTOCOL_LANGUAGE_CROSS_LINK.1` (docs — P3)

| Field | Value |
|-------|--------|
| **Target** | Link Operating Protocol Class A i18n to global language + Tier-1 audit |
| **Type** | Docs only |

---

## Validation (this pack)

| Check | Result |
|-------|--------|
| App logic changed | **No** |
| Locale JSON changed | **No** |
| Docs only | **Yes** |

---

## Confirmations

| Question | Answer |
|----------|--------|
| Locale JSON changed? | **No** |
| Routes / payment / auth / backend / Prisma / package changed? | **No** |
| Functions removed? | **No** |
| Global Active/Full target? | **Yes** — markets/universes in scope; this audit measures **locale implementation** only |
| Lite/Pilot = demo-only market? | **No** — internal readiness labels per [lock doc](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md) |

---

*End of audit — `VIONA.I18N.TIER1_LOCALE_COMPLETENESS_AUDIT.1`*
