# VIONA Pack B.3 Smart Trio Language Switcher Audit

## 1. Summary

- **Surface chosen:** **ProfileSwitcher** (Option A) — `SmartTrioLanguageChip` embedded in the existing profile-role bottom sheet (multi-role), plus a **floating** chip above the single-role “Account” chip so B2C-only users still reach Smart Trio without a second hero surface.
- **Why safest:** Reuses an established account-adjacent modal pattern; no Home hero changes; no navigation/route/flag changes; no global `changeLanguage`.
- **User can see/change:** Compact line shows **app locale · market · native** labels (via `smartTrio.language.*` / `smartTrio.market.*`). **Change** opens a small **React Native `Modal`** sheet: pick **app language** (`setUserSelectedLocale`, including **Auto** to clear override), pick **market** (`setMarketCode` from fixed `GLOBAL` + 7 markets). Read-only rows show **native / customer / merchant** legs from `resolved`.

## 2. UI Behavior

| Concern | Behavior |
|---------|----------|
| **appLocale** | Shown on chip and driven by `resolveSmartTrioLocale`; user can force a bundled locale via `setUserSelectedLocale`, or **Auto** clears override (resolver + device/profile again). |
| **market** | Default from profile country (`resolveMarketCode`); user override via `setMarketCode` until `user.country` changes (B.2 clears override). |
| **nativeLocale** | Read from resolver for current market; shown on chip and in sheet (read-only). |
| **Local-only selected locale** | `userSelectedLocale` in `SmartTrioContext` only — **no** `i18n.changeLanguage`. |
| **Local-only selected market** | `marketOverride` path in B.2 context — **no** API/DB. |

## 3. Runtime audit (rg snapshot)

| Area | Current language/market UI | Gap | Risk | Recommendation |
|------|------------------------------|-----|------|------------------|
| **Home** | `useTranslation` for strings | No Smart Trio | Low | Defer; keep Home uncluttered (B.3). |
| **ProfileSwitcher** | Role sheet + account row; English sheet titles | No trio control | Low | **P0:** Add chip + modal (done). |
| **Local** | `expo-localization` + `useTranslation` | Trio not surfaced | Med | Pack B.3+ or tie to `useSmartTrio` later. |
| **Travel** | `useTranslation` | Same | Med | Future travel direction pack. |
| **Settings/Profile hub** | `PersonalHub` separate | Could duplicate switcher | Med | Single source: ProfileSwitcher chip for now. |
| **Merchant/B2B** | `utils/i18n` + formatting | Trio legs not shown in shell | Low | Resolver already role-aware via `useUserStore`. |
| **Navigation shell** | Tab labels `useTranslation` | No change | Low | No edits. |

## 4. What This Does Not Do

- No global `i18n.changeLanguage` rollout.
- No DB persistence of Smart Trio picks.
- No API mutation.
- No payment, booking, wallet, or backend changes.
- No AI production action changes.

## 5. Safety

| Check | Result |
|--------|--------|
| payment touched? | **no** |
| booking touched? | **no** |
| wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| route names changed? | **no** |
| feature flags changed? | **no** |

## 6. Validation

| Command | Result |
|---------|--------|
| `npm run ci:expo-readiness` | PASS |
| `npm run typecheck` | OK (`prisma generate` + `tsc --noEmit`) |
| `npm run lint` | Exit 0 (0 errors; existing warnings only) |
| `npm run ci:release-discipline` | OK (includes `preflight:release`, smoke, trust) |

## 7. Next pack recommendation

- **Pack E:** Local commerce copy keyed by `currentMarket` / trio legs.
- **Pack D:** Travel direction selector aligned with market + native leg.
- **Persistence:** product decision only — AsyncStorage or profile field; out of scope for B.3.
