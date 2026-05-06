# VIONA Pack B Smart Trio i18n Foundation Audit

**Date:** 2026-05-06  
**Scope:** Typed Smart Trio foundation (market matrix + resolver + minimal i18n keys). No full-app translation, no runtime shell swap, no payment/booking/backend changes.

---

## 1. Summary

- **What Smart Trio means:** Every market exposes **Vietnamese + English + native local language** for UX and content layering (Companion OS / Global architecture §5).
- **Why this matters for global commercialization:** Enables **native customers booking Vietnamese merchants** and **Vietnamese abroad** with honest locale defaults, without silently collapsing to a single language or faking production readiness (`VIONA_GLOBAL_COMMERCIALIZATION_READINESS_AUDIT.md` gap: Smart Trio “early”).

---

## 2. Current i18n State (grep + file read)

| Area | Current locale behavior | Smart Trio gap | Risk | Recommendation |
|------|-------------------------|----------------|------|----------------|
| **App shell** | `src/i18n/index.ts` — `react-i18next` + `expo-localization`; `lng` from device; `fallbackLng: 'en'`; resources `vi,en,cs,de,fr,ko,ja` | No `appLocale` / `customerLocale` / `merchantLocale` split; no market-aware defaults | Shell OK for Lite; B2B2C copy may default wrong leg | Pack B.2: wire resolver output into shell + profile store |
| **Home** | Mix `useTranslation` + `getStrings` (`languageMapper` / `strings.ts`) | Trio not modeled per persona | Inconsistent with blueprint “third leg” | Use `resolveSmartTrioLocale` when adding Home briefing i18n |
| **Local** | `LocalScreen` + `getStrings` / hardcoded marketing lines | Native customer path not first-class in types | Trust gap for non-VN customers | Pack B.2 + content model later |
| **Travel** | Travel screens + SOS strings; some hardcoded DE/CZ embassy samples | Direction vs market locale not unified | Copy drift “KNG Travel” legacy (external audit) | Pack D travel direction + trio labels |
| **Merchant/B2B** | B2B screens mostly EN/product English; demo labels | Merchant default VI not enforced in runtime | Merchant UX may open in EN only | Resolver `merchantLocale` default VI when role merchant |
| **AI Receptionist** | Industry playbooks EN-heavy | Third leg for customer intake not wired | Pilot honesty OK; locale not structured | Pass `customerLocale` into future AI UI only when approved |
| **Booking** | `getStrings` / `resolveAiUiLocale` only `vi`|`en` for some AI UI | Narrower than Smart Trio bundle | Booking flows may ignore `cs/de` device users for AI-only surfaces | Keep booking stable; extend carefully |
| **Notifications** | Not audited in depth this pass | Unknown | May be EN-only | Future pack: notification locale channel |
| **SOS** | `EmergencySosService` multilingual scripts hardcoded | Not driven by Smart Trio resolver | Acceptable for safety strings short-term | Map SOS templates to `nativeLocale` later |
| **Academy** | `getStrings` + kids rewards VI strings | Trio for family learning not modeled | Low for foundation pack | Academy Lite later |

**Hardcoded geography / language samples (grep sample):** Praha, Berlin, Czech/German phrases appear in `EmergencySosService`, `localFixerCatalog`, admin CRM mocks — **demo data**, not the Smart Trio matrix.

---

## 3. Files Added

| File | Role |
|------|------|
| `src/core/i18n/smartTrioTypes.ts` | Typed unions + input/output contracts |
| `src/core/i18n/smartTrioConfig.ts` | `normalizeLocaleCode`, `getSupportedLocalesForMarket`, `isSmartTrioLocaleSupported`, re-export `MARKET_LANGUAGE_CONFIG`, example fixtures |
| `src/core/i18n/resolveSmartTrioLocale.ts` | Pure `resolveSmartTrioLocale` |
| `src/core/i18n/index.ts` | Barrel exports for Pack B consumers |
| `src/core/markets/marketLanguageConfig.ts` | Static market matrix rows |

---

## 4. Market Language Matrix

| Market | Supported locales | Native locale | Merchant default | Customer default |
|--------|-------------------|---------------|------------------|-------------------|
| CZ | vi, en, cs | cs | vi | cs |
| DE | vi, en, de | de | vi | de |
| VN | vi, en | vi | vi | vi |
| US | vi, en | en | vi | en |
| FR | vi, en, fr | fr | vi | fr |
| JP | vi, en, ja | ja | vi | ja |
| KR | vi, en, ko | ko | vi | ko |
| GLOBAL | vi, en | en | vi | en |

---

## 5. Resolver Behavior (examples)

| Scenario | Expected highlights |
|----------|----------------------|
| **Vietnamese merchant in CZ** | `merchantLocale` → `vi` when supported; `appLocale` prefers user/device then **vi** for merchant role |
| **Czech customer** | `customerLocale` defaults to **cs** in CZ; `userSelectedLocale` / device wins when supported |
| **German market** | Native leg **de**; English remains bridge fallback |
| **Vietnam inbound traveler** | Customer default **vi**; EN user selection still wins if set |
| **Unsupported locale (e.g. pl-PL)** | Falls through to **customer default** or **en** bridge per rules |
| **Unknown market** | `marketCode` omitted → **GLOBAL** row; `global_market_fallback` when resolution chain hits unsupported fallback with implicit global |

---

## 6. What This Does Not Do Yet

- Does not translate entire app or migrate `getStrings` tables.
- Does not change global `i18n.changeLanguage` / runtime shell language automatically.
- Does not change booking, payment, Stripe, Prisma, or backend contracts.
- Does not create DB migration or user preference columns.

---

## 7. Safety

- payment touched? **no**
- booking touched? **no**
- wallet touched? **no**
- DB/Prisma touched? **no**
- AI production touched? **no**
- route names changed? **no**
- feature flags changed? **no**

---

## 8. Validation

Evidence (local, branch `pack-b-smart-trio-i18n-foundation`, 2026-05-06):

- `npm ci` → **PASS**
- `npm run ci:expo-readiness` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run lint` → **PASS** (0 errors, existing warnings only)
- `npm run ci:release-discipline` → **PASS**

---

## 9. Next Pack Recommendation

1. **Pack B.2** — Market-aware language switcher + persist `userSelectedLocale` / bind to `resolveSmartTrioLocale`.
2. **Pack D** — Travel direction selector (if not already shipped end-to-end).
3. **Later** — Merchant/service localized content (`LocalizedText` blueprint) backed by CMS/API when approved.
