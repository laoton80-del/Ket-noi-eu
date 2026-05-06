# VIONA Pack B.2 Smart Trio Runtime / Shell Audit

## 1. Summary

- **Wired:** `SmartTrioProvider` + `useSmartTrio()` + `SmartTrioContextValue` in `src/context/SmartTrioContext.tsx`, wrapping the app shell immediately inside `AuthProvider` in `App.tsx`. Resolution uses the existing pure helper `resolveSmartTrioLocale` with `expo-localization` device tag, `useUserStore` active shell role → `UserLanguageRole`, profile country → `resolveMarketCode` → default market, and local-only `userSelectedLocale` / market override state (override resets when `user.country` changes).
- **Foundation only:** No `i18n.changeLanguage`, no new language switcher UI, no persistence of Smart Trio picks, no API/DB. Screens can opt in via `useSmartTrio()` when Pack B.3+ needs trio legs.

## 2. Runtime Context

| Area | Current runtime behavior | Smart Trio integration opportunity | Risk | Action |
|------|--------------------------|-------------------------------------|------|--------|
| **i18n bootstrap** | `src/i18n/index.ts` initializes `i18next` with `expo-localization` device code, `fallbackLng: 'en'`; `persistLanguage` calls `changeLanguage` for stored UI language. | Expose parallel **read-only** trio resolution without touching `lng` / resources. | Accidentally coupling Smart Trio to global `lng` could double-source truth. | **B.2:** Resolver inputs are local + device + profile market only; no `changeLanguage`. |
| **Auth/user context** | `AuthContext` normalizes `user.country` (ISO2 or `ZZ`), tier, `serverRole`. | Drive default `MarketCode` from `user.country` via `resolveMarketCode`. | Wrong mapping implies wrong market row. | **B.2:** Static ISO2/ISO3 map with `GLOBAL` fallback; override cleared on country change. |
| **App shell / navigation** | `MainTabNavigator` uses `useTranslation` for tab labels; no trio. | Provider under `AuthProvider` so shell and deep screens can read trio. | Provider order: must be inside `AuthProvider` for `useAuth`. | **B.2:** `SmartTrioProvider` nested inside `AuthProvider`. |
| **ProfileSwitcher** | `useTranslation` for copy only. | Could show debug/trio (deferred). | UI noise. | **B.2:** No change; hook available for later. |
| **Home** | `useTranslation` on `HomeScreen`. | Optional `useSmartTrio` for future cards. | None for B.2. | **B.2:** No Home edits. |
| **Local** | `expo-localization` + `useTranslation` for region heuristics. | Same device signal now centralized in context for future Local switcher. | Duplicate device reads (minor). | **B.2:** Context reads `getLocales()` once per provider mount pattern. |
| **Travel** | `useTranslation` only. | Future travel direction / trio. | None. | **B.2:** No Travel edits. |
| **B2B / merchant** | Merchant screens use `utils/i18n` + `i18n.language` for number formatting. | `activeRole === 'B2B'` → `userRole: 'merchant'` in resolver for merchant leg defaults. | Must stay aligned with shell role, not a second auth source. | **B.2:** Map `useUserStore().currentActiveRole` only. |
| **AI Receptionist** | Prompts / locale via `countryPacks` + `aiPrompts` (unchanged). | Future: feed `resolved` into AI UI only. | Touching production AI actions is out of scope. | **B.2:** No AI path changes. |

### Provider / hook / resolver

- **Provider:** `SmartTrioProvider` — React state only; no API/DB.
- **Hook:** `useSmartTrio()` — throws if used outside provider.
- **Resolver:** `resolveSmartTrioLocale({ userSelectedLocale, deviceLocale, marketCode: currentMarket, userRole })` → `ResolvedSmartTrioLocale` (`appLocale`, `customerLocale`, `merchantLocale`, `nativeLocale`, `supportedLocales`, `fallbackLocale`, `reason`).
- **Local-only state:** `userSelectedLocale` (React `useState`); `marketOverride` + `setMarketCode` (cleared when `user.country` changes so profile stays authoritative for defaults).

## 3. Market Resolution

- **Default:** `resolveMarketCode(user?.country)`; empty / `ZZ` / unknown ISO → `GLOBAL`.
- **Explicit markets:** ISO2 `CZ|DE|VN|US|FR|JP|KR` or ISO3 `CZE|DEU|VNM|USA|FRA|JPN|KOR` → corresponding `MarketCode`; else `GLOBAL`.
- **Override:** `setMarketCode` sets a local override until `user.country` changes (then override resets to follow profile).

## 4. UI Impact

- **Visual:** None (no new labels or switchers).
- **Full app language:** Unchanged — global `react-i18next` behavior not modified in Pack B.2.

## 5. What This Does Not Do

- No full translation rollout for trio locales beyond existing bundles.
- No DB persistence of Smart Trio selection.
- No API mutation for locale or market.
- No payment, booking, wallet, or backend changes.
- No AI production action or prompt edits.

## 6. Safety

| Check | Result |
|--------|--------|
| payment touched? | **no** |
| booking touched? | **no** |
| wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| route names changed? | **no** |
| feature flags changed? | **no** |

## 7. Validation

Run locally from repo root (after `npm ci`):

| Command | Result |
|---------|--------|
| `npm ci` | OK |
| `npm run ci:expo-readiness` | PASS |
| `npm run typecheck` | OK (`prisma generate` + `tsc --noEmit`) |
| `npm run lint` | Exit 0 (warnings only in existing files; 0 errors) |
| `npm run ci:release-discipline` | OK (includes `preflight:release`, smoke, trust checks) |

## 8. Next Pack Recommendation

- **Pack B.3:** Language switcher for Local / Travel surfaces wired to `setUserSelectedLocale` + optional sync policy with `persistLanguage` (explicit product decision).
- **Pack E:** Localized merchant / service content rows keyed by `currentMarket`.
- **Travel:** Direction selector if not already shipped; trio native leg as UX hint.
