# Commercial / Store readiness (repo scope)

This document tracks what is commercially ready **inside the repository** and what remains external.

## Repo-side commercial signals

- Multi-language UI backbone exists in `src/i18n/strings.ts` (`vi`, `en`, `cs`, `de`).
- Wallet/payment wording is production-leaning:
  - server-authoritative credits
  - explicit failure messaging for unconfigured payment backend
  - clear top-up verification states (`src/screens/ComboWalletScreen.tsx`)
  - payment/wallet **alerts and payment-gate copy** use `strings.comboWallet` in `src/i18n/strings.ts` (vi/en/cs/de).
- Profile settings include direct user-facing support/legal guidance (`src/screens/CaNhanScreen.tsx`), with alert copy routed through `src/i18n/strings.ts` (all supported languages).
- **`npm run commercial:preflight`** is enforced by **`npm run ci:release-discipline`** (see `scripts/ci-release-discipline.mjs` and `.github/workflows/release-discipline.yml`).
- Brand/legal/support anchors are centralized in `src/config/appBrand.ts`.
- Launch/pilot flags are explicit in `src/config/launchPilot.ts` and documented in trust/release docs.

## Store-facing metadata in repo

See `docs/STORE_METADATA_TEMPLATE.md` for release copy templates:

- short description
- full description
- keyword hints
- support and marketing URLs
- privacy/terms URLs

## Legal/support placeholders policy

- URLs in `APP_BRAND.legal` are intentional placeholders until legal publishes final pages.
- Support channel in `APP_BRAND.supportEmail` is a placeholder mailbox; must be replaced by a monitored address before public release.

## External blockers (outside repo)

1. Final legal review and publication of production Terms/Privacy pages.
2. Store Console assets and text approvals (App Store Connect / Play Console).
3. Business paperwork/tax/subscription compliance by target markets.
4. Support operations SLA/on-call ownership and ticketing workflow.

## Practical release rule

Do not market as fully commercial/global-ready unless:

- legal URLs are live and approved,
- support mailbox/process is operational,
- store listing metadata and policy forms are complete.
