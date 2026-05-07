# VIONA Pack AB Brand / i18n Alignment Audit

## 1. Summary

- Audited brand/copy/i18n across public-facing surfaces in `src/screens`, `src/components`, `src/navigation`, `src/i18n/locales`, and brand config.
- Fixed high-confidence public copy debt where legacy names (`ViGlobal`, `Kết Nối Global`) or `VIG Token` language could reduce trust during demo/rehearsal.
- Added non-vi/en namespace fallback stubs for critical Smart Trio / ops namespaces to prevent raw-key risk.
- Added a read-only guard script `brand:i18n-readiness` to fail when forbidden public markers are detected in key public surfaces.
- Kept legacy/internal historical naming in allowlisted internal/admin/docs contexts and marked unresolved ambiguous surfaces as **Needs confirmation**.

Why this matters before demo/rehearsal: brand inconsistency and raw i18n fallback on public paths can look like a production reliability issue even when core logic is stable.

## 2. Brand Rules Applied

- Public app brand: **VIONA**.
- Public domain target in app copy: **`vionaio.com`** where updated in this pack.
- Public points wording: **VIO Credits / VIO** (not `VIG Token(s)` on cleaned surfaces).
- No public `VIG Token` / `VIG Tokens` on cleaned trust-critical surfaces.
- No new crypto/cash-out implication introduced.

## 3. Audit Findings

| Area | Finding | Classification | Action |
|------|---------|----------------|--------|
| app config / brand config | `APP_BRAND` already uses `publicName: VIONA`; legacy names still exist for internal compatibility. | B (internal/history) | Kept legacy internals; updated legal URLs to `vionaio.com`. |
| Home / Hub | Several legacy terms remain outside this pack scope in some hub-related files. | C (Needs confirmation) | Guarded by script warnings/allowlist; no risky mass replace. |
| Local | `TienIchScreen` alert title still used legacy brand. | A (fix now) | Replaced with `VIONA`. |
| Travel | `ViralWrapScreen` had `ViGlobal` hashtag/accessibility + old domain. | A (fix now) | Updated to `VIONA`, `#VIONA`, and `https://vionaio.com/download`. |
| B2B AI Receptionist | Pilot surface itself mostly i18n-driven and already aligned to pilot guardrails. | B | No behavior change; kept focus on copy-only adjustments. |
| Admin evidence panels | Admin screens still contain legacy terms (intentionally allowlisted for now). | C | Marked **Needs confirmation** for later cleanup to avoid operational confusion. |
| Smart Trio switcher | `en/vi` namespace coverage complete; non-vi/en lacked new namespace roots. | A (fix now) | Added fallback namespace stubs in `cs/de/fr/ja/ko`. |
| ProfileSwitcher / account | `CaNhanScreen` contained legacy alert and consumer-home copy. | A | Replaced with `VIONA`. |
| VIO / wallet / credits copy | `LifeOSDashboard` used `VIG Token`. | A | Replaced with `VIO Credits`. |
| non-vi/en locale coverage | `cs/de/fr/ja/ko` were missing critical namespace roots for newer features. | A | Added safe fallback roots (not full localization). |
| hardcoded CZ/DE/Prague/Berlin defaults | Multiple sample/demo entries still reference Prague/Berlin/CZ/DE. | C | Kept for now; flagged as **Needs confirmation** (some are demo fixtures, some may be product examples). |
| docs-only legacy references | Legacy terms appear widely in historical docs/audits by design. | B | Left unchanged. |

## 4. Files Changed

| File | Reason |
|------|--------|
| `src/screens/LifeOSDashboard.tsx` | Replace `VIG Token` public copy with `VIO Credits`. |
| `src/screens/LiveInterpreterScreen.tsx` | Replace `ViGlobal` server mention with `VIONA`. |
| `src/screens/shared/QRScannerScreen.tsx` | Replace camera consent copy `ViGlobal` -> `VIONA`. |
| `src/screens/auth/RoleSelectionScreen.tsx` | Replace legacy brand in title/alerts. |
| `src/screens/b2c/ViralWrapScreen.tsx` | Replace legacy brand, hashtag, domain, and `VIG` wording in public share copy. |
| `src/screens/TienIchScreen.tsx` | Replace legacy alert title. |
| `src/screens/CaNhanScreen.tsx` | Replace legacy alert/home copy text. |
| `src/screens/commercial/ProSubscriptionPaywall.tsx` | Replace legacy brand in alert/screen title. |
| `src/screens/commercial/PartnerOnboardingScreen.tsx` | Replace legacy brand in success/lead copy and alert title. |
| `src/screens/commercial/AngelInvestmentHub.tsx` | Replace legacy brand references in user-facing text. |
| `src/screens/commercial/DashboardScreen.tsx` | Replace legacy onboarding message brand reference. |
| `src/screens/b2c/ReferralRewardScreen.tsx` | Replace share text/title brand wording. |
| `src/screens/b2c/academy/VietKidsScreen.tsx` | Replace `ViGlobal` kicker with `VIONA`. |
| `src/screens/b2b/B2BBookingDashboard.tsx` | Replace summary line prefix `ViGlobal` -> `VIONA`. |
| `src/screens/broker/BrokerQrTabScreen.tsx` | Replace legacy domain/brand in QR hint. |
| `src/screens/b2c/SOSModal.tsx` | Replace debug labels `ViGlobal SOS` -> `VIONA SOS`. |
| `src/screens/KetNoiYeuThuongScreen.tsx` | Replace legacy brand references in trust narrative. |
| `src/components/commercial/PaymentCheckoutSheet.tsx` | Replace platform fee label brand name. |
| `src/components/commercial/PaymentCheckoutSheet.web.tsx` | Replace platform fee label brand name. |
| `src/config/appBrand.ts` | Update public legal URLs to `vionaio.com`. |
| `src/i18n/locales/cs.json` | Add fallback namespace stubs. |
| `src/i18n/locales/de.json` | Add fallback namespace stubs. |
| `src/i18n/locales/fr.json` | Replace legacy terms + add fallback namespace stubs. |
| `src/i18n/locales/ja.json` | Replace legacy terms + add fallback namespace stubs. |
| `src/i18n/locales/ko.json` | Replace legacy terms + add fallback namespace stubs. |
| `scripts/brand-i18n-readiness-check.mjs` | New read-only guard script for brand/i18n readiness. |
| `package.json` | Add `brand:i18n-readiness` script. |

## 5. Locale Coverage

| Namespace | vi | en | cs | de | fr | ja | ko | Notes |
|-----------|----|----|----|----|----|----|----|------|
| `smartTrio` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Non-vi/en fallback copy, not final localization review. |
| `travel.direction` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `localCommerce` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `aiReceptionist.pilot` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `aiCost` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `telephony` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `aiUsage.preview` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `aiEnforcement` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `aiAlerts` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |
| `incidents` | Yes | Yes | Fallback root | Fallback root | Fallback root | Fallback root | Fallback root | Same note. |

## 6. Legacy Terms

| Term | Public status | Internal/docs allowed? | Action |
|------|---------------|------------------------|--------|
| ViGlobal | Not allowed on cleaned public surfaces | Yes | Replaced on selected public files; retained in allowlisted internal/admin/history. |
| Kết Nối Global | Not allowed on cleaned public surfaces | Yes | Replaced on selected public files; retained in allowlisted/internal configs and historical docs. |
| KNG | Needs confirmation case-by-case (some business/internal abbreviations) | Yes | No blind replacement; flagged for later pass. |
| VIG | Needs confirmation by context (`VIG` symbols/ledger internals) | Yes | Replaced in selected public copy; retained internal technical references. |
| VIG Token | Not allowed on cleaned public trust surfaces | Limited | Replaced on cleaned surfaces; allowlisted internal/icon/academy assets for now. |
| Prague/Berlin/Praha/Czech/Germany | Needs confirmation (demo fixtures vs global defaults) | Yes | Not blindly changed in this pack; tracked as remaining debt. |

## 7. What This Does Not Do

- No full localization quality review by native speakers.
- No DB/backend/payment/booking/wallet logic changes.
- No route-name changes.
- No feature-flag behavior changes.
- No production behavior changes.

## 8. Safety

- payment touched? **no** (copy-only labels)
- booking touched? **no** (copy-only summary label)
- wallet touched? **no** (copy-only text)
- DB/Prisma touched? **no**
- AI production touched? **no**
- Twilio touched? **no**
- route names changed? **no**
- feature flags changed? **no**

## 9. Validation

- `npm ci`
- `npm run ci:expo-readiness`
- `npm run typecheck`
- `npm run lint`
- `npm run ci:release-discipline`
- `npm run brand:i18n-readiness`
- `npm run ops:readiness`
- `npm run ai:cost-readiness`
- `npm run twilio:sandbox-readiness`
- `npm run ai:usage-readiness`
- `npm run ai:usage-preview-readiness`
- `npm run ai:auto-pause-readiness`
- `npm run ai:admin-alert-readiness`
- `npm run incident:dry-run-readiness`
- `npm run gate:production-readiness`
- `npm run pilot:rehearsal-readiness`

## 10. Remaining Debt

- Final native-speaker localization review for non-vi/en.
- App Store copy / screenshots brand pass later.
- Remaining internal legacy names cleanup later (with explicit scope boundaries).
- Asset/logo QA and social-share visual pass.
- Prague/Berlin/CZ/DE sample defaults need product confirmation before removal.

## 11. Next Pack Recommendation

- Execute real merchant pilot rehearsal (ops) after owner assignment and evidence capture.
- Or Pack AC for App Store / web public brand kit alignment.
- DB/payment/Twilio production work only after explicit approval.
