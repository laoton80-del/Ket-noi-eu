# VIONA.I18N.GLOBAL_LANGUAGE_STRATEGY_AUDIT.1

**Document ID:** `VIONA.I18N.GLOBAL_LANGUAGE_STRATEGY_AUDIT.1`  
**Type:** Strategy audit (docs only — no app logic, no new locale files)  
**Branch:** `pack-af13-i18n-brand-drift-sweep` (continued from brand-drift i18n wave)  
**Base context:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/audit/VIONA_I18N_BRAND_DRIFT_SWEEP_1.md`  
**Date:** 2026-05-16  

**Governing law:** VIONA is **Global Vietnamese Companion OS + Super App Mini-App Platform**. Language strategy is **global-first**. Bundled locale JSON files today are **MVP / pilot implementation**, not a permanent country or language ceiling.

---

## Executive summary

| Item | Decision |
|------|----------|
| **Global principle** | Every market targets **Smart Trio**: Vietnamese + English + native local language. **English** is the product copy baseline and missing-key bridge. **Vietnamese** is the diaspora / merchant anchor. **Native** completes local customer and inbound-traveler trust. |
| **Current shipped UI languages** | `en`, `vi` (full); `cs`, `de` (partial pilot); `fr`, `ko`, `ja` (stub / namespace guards) |
| **Not a country limit** | Absence of `pl`, `es`, `th`, etc. in `resources` today is **capacity**, not strategy. Tier 2–3 markets are planned via matrix + packs, not by declaring “EN/VI only forever.” |
| **Fallback** | `fallbackLng: 'en'` (i18next). Partial locales must not override safety-critical keys with unreviewed machine copy. |
| **Next work** | Loyalty catalog brand sweep → locale completeness packs per tier → wire `contentLocale` / `notificationLocale` / `aiConversationLocale` channels → expand `MARKET_LANGUAGE_CONFIG` as markets go live |

---

## 1. Current locale inventory

### 1.1 Bundled translation files (`src/i18n/locales/`)

| File | Code | ~Size (2026-05-16) | Implementation tier | Role today |
|------|------|---------------------|------------------------|------------|
| `en.json` | `en` | ~1,692 lines / 87 KB | **Tier 0 — canonical** | Source of truth for new keys; legal/safety baseline; `fallbackLng` target |
| `vi.json` | `vi` | ~1,692 lines / 98 KB | **Tier 0 — canonical** | Full parity with `en` for diaspora + Vietnam-native UX |
| `cs.json` | `cs` | ~179 lines / 7.6 KB | **Tier 1 — pilot (CZ)** | Partial: login, vietnamHub, sos (merged), tourism, smartTrio, travel/local/ai stubs |
| `de.json` | `de` | ~179 lines / 7.6 KB | **Tier 1 — pilot (DE)** | Same shape as `cs` |
| `fr.json` | `fr` | ~86 lines / 4.1 KB | **Tier 1 — stub** | vietnamHub + sos + namespace fallback stubs (Pack AB pattern) |
| `ko.json` | `ko` | ~86 lines / 4.2 KB | **Tier 1 — stub** | Same as `fr` |
| `ja.json` | `ja` | ~86 lines / 4.2 KB | **Tier 1 — stub** | Same as `fr` |

### 1.2 Runtime wiring (`src/i18n/index.ts`)

- **Engine:** `i18next` + `react-i18next` + `expo-localization`
- **`supportedLngs`:** `en`, `vi`, `cs`, `de`, `fr`, `ko`, `ja`
- **`fallbackLng`:** `en`
- **Device bootstrap:** `pickInitialLanguage()` maps device `languageCode` to one of the seven codes; otherwise **en**
- **SOS overlay:** `mergeSosWithEnglishBase()` — each non-EN file’s `sos` object is shallow-merged **on top of** `en.sos` so new EN keys resolve; **locale-specific `sos` keys still win** and caused production-unsafe copy until `VIONA.I18N.SOS_LOCALE_OVERLAY_FIX.1` (see brand-drift audit)

### 1.3 Adjacent (not full locale files)

| Module | Purpose | Locale scope |
|--------|---------|----------------|
| `src/i18n/strings.ts` + `languageMapper` | Legacy `getStrings()` paths | Primarily **vi / en** |
| `src/i18n/localeFallback.ts` | `resolveAiUiLocale()` | **vi \| en** only (AI/UI narrow bridge) |
| `src/i18n/persistLanguage.ts` | User-selected UI language persistence | Same seven codes as `supportedLngs` |
| `src/core/i18n/resolveSmartTrioLocale.ts` | Read-only trio legs per market | **vi, en, cs, de, fr, ja, ko** (typed `SmartTrioLocale`) |
| `src/core/markets/marketLanguageConfig.ts` | Static market matrix | CZ, DE, VN, US, FR, JP, KR, GLOBAL |

**Important:** Smart Trio **resolver** already models eight **markets**; **UI resource files** only cover seven **languages**. US and other Tier 2 markets use **en** (and **vi**) until a native file is added.

---

## 2. MVP vs pilot vs production-ready

| Layer | Status | Meaning for users |
|-------|--------|-------------------|
| **Tier 0 `en` + `vi`** | MVP **complete** for bundled namespaces | Safe to treat as production copy **after** safety/legal review per release |
| **Tier 1 `cs` + `de`** | **Pilot** — high-value namespaces only | Device/users in CZ/DE see localized slices; most UI falls back to **en** |
| **Tier 1 `fr` + `ko` + `ja`** | **Pilot stub** — anti raw-key guards | Prevents `smartTrio.*` / ops namespace missing-root crashes; **not** full market launch |
| **Hardcoded screen copy** | Ongoing debt | Travel/Local/B2B still mix `useTranslation`, `getStrings`, and inline strings — not limited by locale file count |
| **AI / notifications** | Pre-channel | No dedicated `notificationLocale` or `contentLocale` pipeline in i18n yet |

**Product rule:** Showing a language in **Settings / Smart Trio chip** implies **honest coverage** — label stub markets as **Preview · English bridge** until Tier 1 completeness threshold is met (see §7).

---

## 3. Language context model (required contexts)

VIONA separates **who sees the UI**, **which market rules apply**, and **which language content was authored in**. These are orthogonal; collapsing them causes wrong SOS language, wrong merchant receipts, or unsafe auto-translation.

| Context | Definition | Primary source today | Target owner |
|---------|------------|----------------------|--------------|
| **`appLocale`** | Language of the **shell UI** (tabs, settings, system alerts) | `i18n.language` via `persistUserLanguage` / device | Core OS / i18n |
| **`marketLocale`** | **Native third leg** for the active **market row** (country/commercial region) | `resolveSmartTrioLocale().nativeLocale` + `MARKET_LANGUAGE_CONFIG` | Core OS / markets |
| **`customerLocale`** | Language for **buyer-facing** copy (storefront, booking guest, traveler) | Resolver `customerLocale`; defaults from market matrix | Mini-app + commerce |
| **`merchantLocale`** | Language for **merchant operating** UI (dashboard, SKU admin, pilot forms) | Resolver `merchantLocale`; default **vi** for Vietnamese merchants abroad | B2B / Merchant |
| **`contentLocale`** | Language **content was written in** (listing, menu, tour description, supplier catalog) | Often **vi** or supplier language; **not** auto-replaced by `appLocale` | CMS / catalog / import |
| **`notificationLocale`** | Language for **push/email/SMS** templates | Mostly **en** / hardcoded templates today | Notifications pack |
| **`aiConversationLocale`** | Language for **AI session** (Leona, receptionist, teacher) | `resolveAiUiLocale` → **vi \| en**; device/market wider in trio | AI surfaces pack |

**Smart Trio mapping:** For market `M`, supported set is `{ vi, en, native(M) }`. User override (`userSelectedLocale`) wins when supported; else device; else role defaults (`merchantLocale` → vi preference; `customerLocale` → native default).

**`contentLocale` rule:** Changing `appLocale` must **not** silently rewrite merchant-authored `contentLocale` text. AI may **suggest** translation; publish requires review gate (Operating Protocol §11.6 B2B AI rules).

---

## 4. Rollout tiers

### Tier 0 — Core (always on)

| Languages | Markets | Deliverable |
|-----------|---------|-------------|
| **vi**, **en** | GLOBAL, VN, US (en bridge), all diaspora | Full `en.json` / `vi.json` parity; safety keys reviewed per release |

**Exit criteria:** No public KNG/VIG/ViGlobal drift; checkout/SOS/academy safety copy aligned with protocol.

### Tier 1 — Current pilot markets (bundled third leg)

| Native | Markets in matrix | Locale file | Completeness target |
|--------|-------------------|-------------|---------------------|
| **cs** | CZ | `cs.json` | login, sos, tourism, travel hub, local commerce, smartTrio, aiReceptionist pilot |
| **de** | DE | `de.json` | Same namespaces as cs |
| **fr** | FR | `fr.json` | Expand from stub → same pilot set as cs/de |
| **ja** | JP | `ja.json` | Same |
| **ko** | KR | `ko.json` | Same |

**Exit criteria:** No raw i18n keys on primary flows for that market; SOS/checkout/legal keys **match EN safety posture** (human review); Smart Trio chip shows three real legs.

### Tier 2 — High-priority Vietnamese diaspora markets

| Priority markets | Typical native leg | Notes |
|------------------|-------------------|--------|
| **US**, **CA**, **AU** | `en` (native = en in matrix today) | Trio collapses to **vi + en**; invest in **en** quality and **vi** diaspora copy |
| **TW**, **HK** | `zh-Hant` (future) | Not in bundle — plan `zh-TW` file + matrix row |
| **FR**, **DE**, **CZ** (diaspora) | Already Tier 1 native | Merchant **vi** + local customer native |
| **KR**, **JP** | Tier 1 stubs | Complete Tier 1 before marketing “launch” |

**Strategy:** Ship **market row** in `MARKET_LANGUAGE_CONFIG` before or with locale file; never imply full app translation with only stub JSON.

### Tier 3 — Global expansion markets

Examples (non-exhaustive): **PL, ES, IT, NL, TH, SG, MY, AE, GB** (en), **MX** (es), **BR** (pt).

| Step | Action |
|------|--------|
| 1 | Business case + Trust & Safety sign-off for emergency copy in target region |
| 2 | Add `MarketCode` + `MARKET_LANGUAGE_CONFIG` row (vi, en, native) |
| 3 | Add locale file with **safety-first key subset** (sos, emergencySos, checkout, login, smartTrio) |
| 4 | Gradual namespace rollout (home → travel → local → merchant) |
| 5 | RTL markets (e.g. AR) — **Needs confirmation** layout pass before Tier 3 |

**Not in scope of this audit:** Creating Tier 3 files in-repo (explicitly deferred).

---

## 5. Fallback policy

### 5.1 i18next / UI strings

| Rule | Policy |
|------|--------|
| **Missing key in local language** | Fall back to **`en`** (`fallbackLng`) |
| **Missing key in `vi`** | Fall back to **`en`** (same chain) |
| **Partial locale files** | Accept EN fallback for non-critical UI; **do not** ship partial **sos**, **checkout**, **emergencySos**, **authPaywall** without EN-equivalent safety meaning |
| **SOS merge** | Keep `mergeSosWithEnglishBase` **or** replace with explicit “safety bundle” import — if overlay remains, **forbid** overriding safety keys without Trust & Safety review |
| **Raw keys** | Forbidden in pilot markets — use Pack AB-style namespace roots or EN fallback labels |

### 5.2 Smart Trio resolver (`resolveSmartTrioLocale`)

| Input | Fallback order |
|-------|----------------|
| User selection | If supported in market → use; else → unsupported_locale_fallback |
| Device locale | If in `supportedLocales` for market → use |
| Role default | Merchant → **vi** when supported; Customer → **nativeLocale** for market |
| Unknown market | **GLOBAL** row → **en** bridge |

### 5.3 Content vs UI

| Type | Fallback |
|------|----------|
| **UI chrome** | `appLocale` → en |
| **User-generated / merchant content** | Show in `contentLocale`; optional “Translate preview” (AI) — never auto-publish |
| **Legal / payment / emergency** | **en** canonical string set; local translation = **human-reviewed** artifact only |

---

## 6. Safety-critical translation policy

**Classes (must not reach production via unchecked machine translation):**

1. **SOS / emergency** — `sos.*`, `emergencySos.*`, `travelSosHub.*`, `sosPlus.*`  
2. **Payment / checkout** — `checkout.*`, tourism payment footnotes, commercial payment sheets  
3. **Legal / liability** — disclaimers, consent, recording, GPS, “does not dispatch”  
4. **Wallet / credits** — VIO Points/Credits; not cash, crypto, withdrawable  
5. **Booking fulfillment** — no “confirmed”, “instant radar”, “payment captured” unless live  

**Process:**

| Stage | Requirement |
|-------|-------------|
| **Author** | Write or update in **`en.json`** first |
| **Translate** | Professional or LQA review for `vi` and each Tier 1+ native |
| **Verify** | Trust & Safety + Payments owner sign-off for classes 1–3 |
| **Merge** | Locale PR must include checklist: no fake emergency, no fake payment, no KNG/VIG public strings |
| **Automated MT** | Allowed only for **non-critical** marketing stubs marked `Preview` in copy |

**Lesson (2026 brand-drift wave):** Partial `cs`/`de`/`fr`/`ja`/`ko` `sos` overlays **replaced** safe EN strings → fixed in `bfb7c40`. Future locales: either **omit** safety keys (inherit EN via merge) or **copy EN verbatim** until reviewed.

---

## 7. Smart Trio by universe

| Universe | Customer leg | Merchant leg | Native / market leg | Current gap | Tier focus |
|----------|--------------|--------------|---------------------|-------------|------------|
| **Home / LifeOS** | `customerLocale` | — | `marketLocale` in command bar | Home marketing still mixed hardcoded + i18n | Tier 0 en/vi polish |
| **SOS** | User `appLocale` | — | Country routing matrix (not locale file alone) | Templates partly hardcoded in services | Safety-first; locale inherits EN until reviewed |
| **Travel** | Traveler `customerLocale` | Partner ops EN/vi | Destination market native | Legacy inline copy reduced in KNG/VIG pack | Tier 1 cs/de/fr for `travelHub` |
| **Local** | Local customer native | Merchant **vi** | `localHub` / `localCommerce` | Smart Trio preview on Local; not full trio drive | Tier 1 + contentLocale for listings later |
| **Academy** | Learner `appLocale` | — | Instruction language = content | Academy en/vi strong; kids vi-heavy | Tier 0; expand native for JP/KR families later |
| **Business / Merchant** | Storefront `customerLocale` | `merchantLocale` **vi** | Market native for local buyers | B2B screens EN-heavy | Merchant pilot packs + vi defaults |
| **B2B Wholesale / E-shop Import** | Storefront language | Merchant operating **vi** | Supplier catalog `contentLocale` | Protocol §2.14 trio; AI translate reviewable | Tier 2+; supplier language traceability |

**Universe rule:** Each mini-app documents which contexts it reads (usually `appLocale` + `customerLocale` + `contentLocale`). SOS and checkout **always** include safety disclaimer keys from Tier 0 EN source.

---

## 8. Rules for adding a new locale

### 8.1 Preconditions

- [ ] `MarketCode` row in `marketLanguageConfig.ts` with **vi + en + native**  
- [ ] Trust & Safety review for **sos** / **emergency** subset  
- [ ] Payments review for **checkout** / wallet wording  
- [ ] Brand check: no **KNG, VIG Token, ViGlobal** in public keys  

### 8.2 File bootstrap order

1. Copy **safety bundle** keys from `en.json` (sos, emergencySos, checkout legal, vio credits footnotes) — translate only after review  
2. `login`, `smartTrio`, `shell` (if exposed)  
3. Universe namespaces for target pilot (e.g. `travelHub`, `localHub`)  
4. Marketing / academy — last  

### 8.3 Registration checklist

- [ ] Add JSON under `src/i18n/locales/<code>.json`  
- [ ] Register in `src/i18n/index.ts` `resources` + `supportedLngs` + `pickInitialLanguage`  
- [ ] Add to `SUPPORTED_UI_LANGUAGES` in `persistLanguage.ts`  
- [ ] Extend `SmartTrioLocale` + matrix if new code  
- [ ] Run ripgrep: `sos`, `checkout`, `KNG`, `VIG`, `dispatch`, `confirmed`  

### 8.4 Quality gates (per locale PR)

| Gate | Owner |
|------|--------|
| No unsafe emergency claims | Trust & Safety |
| No fake payment/booking fulfillment | Payments + CPO |
| No public brand drift | i18n pack owner |
| `npm run typecheck` + `lint` + `smoke` | Release train |

---

## 9. Relationship to recent i18n packs (same branch stack)

| Pack | Status | Relevance to language strategy |
|------|--------|--------------------------------|
| `VIONA.I18N.BRAND_DRIFT_SWEEP.1` | Audit | Identified locale overlay risk |
| `VIONA.I18N.SOS_LOCALE_OVERLAY_FIX.1` | Done (`bfb7c40`) | Proves safety keys must be governed per locale |
| `VIONA.I18N.CHECKOUT_FULFILLMENT_COPY.1` | Done (`0712b0e`) | EN/VI checkout truth baseline |
| `VIONA.I18N.REMOVE_LEGACY_KNG_VIG_PUBLIC_COPY.1` | Done (`6db940a`) | Tier 0 public brand law for travel/B2C |

---

## 10. Recommended next implementation packs

| Priority | Pack ID | Scope | Out of scope |
|----------|---------|-------|--------------|
| **P0** | `VIONA.I18N.LOYALTY_CATALOG_BRAND.1` | `loyaltyRewardsCatalog.ts` — KNG Local, VIG Token titles | Pricing math |
| **P1** | `VIONA.I18N.TIER1_CS_DE_COMPLETE.1` | Bring `cs.json` / `de.json` to pilot completeness on home, travel, local, checkout | New languages |
| **P1** | `VIONA.I18N.TIER1_FR_JA_KO_STUB_UPGRADE.1` | Replace fallback stubs with real copy for FR/JP/KR pilot flows | Full app translate |
| **P2** | `VIONA.I18N.SAFETY_BUNDLE_EXTRACT.1` | Shared `safety-en.json` imported by all locales; strip risky overlay pattern | Backend |
| **P2** | `VIONA.I18N.CONTENT_LOCALE_CHANNEL.1` | Type + display rules for `contentLocale` on listings/import | Auto-publish MT |
| **P2** | `VIONA.I18N.NOTIFICATION_LOCALE.1` | `notificationLocale` on push/email templates | Provider wiring |
| **P3** | `VIONA.I18N.AI_CONVERSATION_LOCALE.1` | Extend `resolveAiUiLocale` to full `SmartTrioLocale` where AI is live | Autonomous booking |
| **P3** | `VIONA.I18N.TIER2_DIASPORA_US_CA_AU.1` | Market rows + en/vi excellence; optional `zh-TW` spike | Tier 3 langs |
| **Wave** | Merge `pack-af13-i18n-brand-drift-sweep` → `master` | SOS + checkout + KNG/VIG + this strategy doc | Feature logic |

---

## 11. Validation (this pack)

| Check | Result |
|-------|--------|
| App logic changed | **No** — documentation only |
| `npm run typecheck` | Run at commit time (expected pass — no TS changes) |
| `npm run lint` | Run at commit time (expected pass) |
| `npm run smoke` | Run at commit time (expected pass) |

---

## 12. Confirmations

| Question | Answer |
|----------|--------|
| App logic / routes / backend / Prisma / payment changed? | **No** |
| New locale files added? | **No** |
| Whole app translated? | **No** |
| Strategy limits countries? | **No** — tiers describe rollout order, not a permanent cap |

---

*End of audit — `VIONA.I18N.GLOBAL_LANGUAGE_STRATEGY_AUDIT.1`*
